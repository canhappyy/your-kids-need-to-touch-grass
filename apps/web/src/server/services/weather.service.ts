import { z } from "zod";
import {
  getWeatherCell,
  summarizeWeather,
  WEATHER_TTL_SECONDS,
} from "@/lib/weather";
import type { MissionWeather } from "@/types/weather";
import { getWeatherCache, type WeatherCache } from "./weather-cache";

/**
 * Validates raw hourly forecast arrays returned by the weather provider.
 *
 * Ensures all required measurement series exist, have equal lengths, and contain
 * sequential hourly timestamps spaced exactly 3,600 seconds (1 hour) apart.
 */
const hourlySchema = z
  .object({
    time: z.array(z.number().int().nonnegative()).min(1),
    weather_code: z.array(z.number().int()),
    precipitation_probability: z.array(z.number().min(0).max(100)),
    uv_index: z.array(z.number().nonnegative()),
    wind_gusts_10m: z.array(z.number().nonnegative()),
  })
  .refine(
    (value) =>
      Object.values(value).every(
        (array) => array.length === value.time.length,
      ) &&
      value.time.every(
        (time, index) => index === 0 || time === value.time[index - 1] + 3600,
      ),
  );

/**
 * Validates the structure of cached weather entries.
 * Stores the Unix epoch timestamp when the forecast was fetched alongside the raw hourly data.
 */
const cachedSchema = z.object({
  fetchedAt: z.number().nonnegative(),
  hourly: hourlySchema,
});

/**
 * Validates the Open-Meteo HTTP API JSON response structure and expected measurement units.
 */
const responseSchema = z.object({
  hourly: hourlySchema,
  hourly_units: z.object({
    time: z.literal("unixtime"),
    wind_gusts_10m: z.literal("km/h"),
    precipitation_probability: z.literal("%"),
  }),
});

/**
 * Optional dependencies that can be injected for testing weather service workflows.
 */
type WeatherDependencies = {
  /** Custom weather cache backend to test cache hit/miss behavior. */
  cache?: WeatherCache;
  /** Custom HTTP fetch implementation to test external API interactions without live network calls. */
  fetcher?: typeof fetch;
  /** Custom clock function returning the current epoch timestamp in milliseconds. */
  now?: () => number;
};

/**
 * Enforces a strict 500 millisecond deadline on cache operations.
 *
 * Why this is needed in natural English:
 * Cache operations are meant to speed up responses. If the cache service hangs, stalls,
 * or suffers an outage, we never want it to block or delay the recommendation response.
 * If the cache operation does not complete within 500 ms, this function rejects with a timeout,
 * allowing the application to immediately proceed with fresh weather or fallback gracefully.
 *
 * @param operation - The asynchronous cache read or write operation to execute.
 * @returns The resolved result of the cache operation.
 */
async function withCacheDeadline<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Weather cache timed out")),
          500,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Retrieves and summarizes the weather forecast for an outdoor mission venue covering the complete outing duration.
 *
 * How this complex function works in natural English:
 * 1. Venue & Duration Validation:
 *    - Immediately returns `{ status: "unavailable" }` if there is no venue (e.g. home/indoor missions),
 *      or if coordinates or duration minutes are invalid/non-positive.
 * 2. Time Window Calculation:
 *    - Establishes the outing window: from `start` (current time) to `end` (`start + totalMinutes`),
 *      which accounts for both the activity duration and travel time.
 * 3. Spatial Cache Grid Lookup:
 *    - Calculates the venue's ~2.2 km grid cell (`getWeatherCell`) to reuse cached forecasts across
 *      neighboring parks and open spaces.
 * 4. Fast Cache Evaluation:
 *    - Queries the cache with a 500 ms timeout. If a fresh forecast (< 30 minutes old) exists and fully
 *      covers the planned outing, it summarizes and returns the weather immediately.
 * 5. Open-Meteo API Fetch:
 *    - If no valid cache entry exists, queries Open-Meteo's hourly forecast API with a 3-second timeout,
 *      requesting weather condition codes, precipitation probability, UV index, and wind gusts.
 * 6. Zod Validation & Summarization:
 *    - Verifies the API response schema and calls `summarizeWeather` to generate user-friendly advice
 *      (e.g., severe storm warnings, sunscreen reminders, umbrella suggestions).
 * 7. Non-Blocking Cache Write:
 *    - Stores the fresh forecast in the cache with the 500 ms deadline so future requests in the same
 *      area benefit without delaying the current user.
 * 8. Resilient Error Handling:
 *    - Any network glitch, schema failure, or upstream outage is caught silently and returns
 *      `{ status: "unavailable" }`, ensuring the core recommendation is always delivered to the family.
 *
 * @param venue - Destination venue with latitude and longitude coordinates, or null for home activities.
 * @param totalMinutes - The total duration of the outing in minutes (activity duration plus round-trip travel).
 * @param dependencies - Optional dependency overrides for testing (cache, fetcher, clock).
 * @returns A promise resolving to a `MissionWeather` object with either `"available"` or `"unavailable"` status.
 */
export async function getMissionWeather(
  venue: { latitude: number; longitude: number } | null,
  totalMinutes: number,
  dependencies: WeatherDependencies = {},
): Promise<MissionWeather> {
  const unavailable: MissionWeather = { status: "unavailable" };
  if (!venue || !Number.isFinite(totalMinutes) || totalMinutes <= 0)
    return unavailable;
  if (
    !Number.isFinite(venue.latitude) ||
    Math.abs(venue.latitude) > 90 ||
    !Number.isFinite(venue.longitude) ||
    Math.abs(venue.longitude) > 180
  )
    return unavailable;
  const now = dependencies.now ?? Date.now;
  const start = now();
  const end = start + totalMinutes * 60000;
  const cell = getWeatherCell(venue.latitude, venue.longitude);
  let cache: WeatherCache | undefined;
  try {
    cache = dependencies.cache ?? getWeatherCache();
    const parsed = cachedSchema.safeParse(
      await withCacheDeadline(cache.get(cell.key)),
    );
    const cacheReadAt = now();
    if (
      parsed.success &&
      cacheReadAt >= parsed.data.fetchedAt &&
      cacheReadAt - parsed.data.fetchedAt < WEATHER_TTL_SECONDS * 1000
    ) {
      const summary = summarizeWeather(parsed.data.hourly, start, end);
      if (summary.status === "available") return summary;
    }
  } catch {
    /* Cache failure must not block fresh weather. */
  }
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(cell.latitude),
      longitude: String(cell.longitude),
      hourly: "weather_code,precipitation_probability,uv_index,wind_gusts_10m",
      wind_speed_unit: "kmh",
      timezone: "Australia/Melbourne",
      timeformat: "unixtime",
      forecast_days: "2",
    }).toString();
    const response = await (dependencies.fetcher ?? fetch)(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return unavailable;
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) return unavailable;
    const summary = summarizeWeather(parsed.data.hourly, start, end);
    if (summary.status !== "available") return unavailable;
    try {
      if (cache)
        await withCacheDeadline(
          cache.set(cell.key, { fetchedAt: now(), hourly: parsed.data.hourly }),
        );
    } catch {
      /* Serve valid forecast even if caching fails. */
    }
    return summary;
  } catch {
    return unavailable;
  }
}
