import { z } from "zod";
import {
  getWeatherCell,
  summarizeWeather,
  WEATHER_TTL_SECONDS,
} from "@/lib/weather";
import type { MissionWeather } from "@/types/weather";
import { getWeatherCache, type WeatherCache } from "./weather-cache";

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
const cachedSchema = z.object({
  fetchedAt: z.number().nonnegative(),
  hourly: hourlySchema,
});
const responseSchema = z.object({
  hourly: hourlySchema,
  hourly_units: z.object({
    time: z.literal("unixtime"),
    wind_gusts_10m: z.literal("km/h"),
    precipitation_probability: z.literal("%"),
  }),
});

type WeatherDependencies = {
  cache?: WeatherCache;
  fetcher?: typeof fetch;
  now?: () => number;
};

/** Cache outages must not hold the recommendation request open. */
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
