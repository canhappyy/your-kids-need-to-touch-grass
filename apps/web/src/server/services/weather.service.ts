import { z } from "zod";
import {
  getWeatherCell,
  summarizeWeather,
  WEATHER_TTL_SECONDS,
} from "@/lib/weather";
import type { MissionWeather } from "@/types/weather";

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
  /** Custom HTTP fetch implementation to test external API interactions without live network calls. */
  fetcher?: typeof fetch;
  /** Custom clock function returning the current epoch timestamp in milliseconds. */
  now?: () => number;
};

/**
 * Retrieves and summarizes the weather forecast for an outdoor mission venue covering the complete outing duration.
 *
 * How this function works:
 * 1. Venue & Duration Validation:
 *    - Immediately returns `{ status: "unavailable" }` if there is no venue (e.g. home/indoor missions),
 *      or if coordinates or duration minutes are invalid/non-positive.
 * 2. Time Window Calculation:
 *    - Establishes the outing window: from `start` (current time) to `end` (`start + totalMinutes`),
 *      which accounts for both the activity duration and travel time.
 * 3. Spatial Cache Grid Lookup:
 *    - Calculates the venue's ~2.2 km grid cell (`getWeatherCell`) to reuse cached forecasts across
 *      neighboring parks and open spaces.
 * 4. Next.js Server Cache (Data Cache):
 *    - Queries Open-Meteo's hourly forecast API with Next.js Data Cache options (`next: { revalidate: 1800, tags: [...] }`).
 *    - In Next.js (local development and on Vercel), identical grid cell requests within the 30-minute window
 *      are served instantly from the Next.js Server Data Cache without hitting Open-Meteo.
 * 5. Zod Validation & Summarization:
 *    - Verifies the API response schema and calls `summarizeWeather` to generate user-friendly advice
 *      (e.g., severe storm warnings, sunscreen reminders, umbrella suggestions).
 * 6. Resilient Error Handling:
 *    - Any network glitch, schema failure, or upstream outage is caught silently and returns
 *      `{ status: "unavailable" }`, ensuring the core recommendation is always delivered to the family.
 *
 * @param venue - Destination venue with latitude and longitude coordinates, or null for home activities.
 * @param totalMinutes - The total duration of the outing in minutes (activity duration plus round-trip travel).
 * @param dependencies - Optional dependency overrides for testing (fetcher, clock).
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
      next: {
        revalidate: WEATHER_TTL_SECONDS,
        tags: [`weather:${cell.key}`],
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) return unavailable;
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) return unavailable;

    const summary = summarizeWeather(parsed.data.hourly, start, end);
    if (summary.status !== "available") return unavailable;

    return summary;
  } catch {
    return unavailable;
  }
}
