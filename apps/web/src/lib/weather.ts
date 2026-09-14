import type { HourlyWeather, MissionWeather } from "@/types/weather";

/**
 * Time-to-live (TTL) for cached weather forecast data in seconds (1,800 seconds = 30 minutes).
 * Weather forecasts are updated frequently enough to stay accurate while preventing unnecessary external API calls.
 */
export const WEATHER_TTL_SECONDS = 1800;

/**
 * Calculates a geographical cache cell and unique cache key for a given latitude and longitude.
 *
 * Why this is needed:
 * Rather than caching weather by exact coordinates or individual park IDs, coordinates are snapped
 * to a ~2.2 km × 2.2 km grid (0.02 degrees). Venues located in the same neighborhood will share
 * the exact same weather forecast, dramatically reducing external API requests to Open-Meteo.
 *
 * @param latitude - The venue's latitude coordinate in decimal degrees.
 * @param longitude - The venue's longitude coordinate in decimal degrees.
 * @returns An object containing the cache key and the normalized grid coordinates to query.
 */
export function getWeatherCell(latitude: number, longitude: number) {
  const latIndex = Math.round(latitude / 0.02);
  const lonIndex = Math.round(longitude / 0.02);
  return {
    key: `playgo:weather:v1:${latIndex}:${lonIndex}`,
    latitude: Number((latIndex * 0.02).toFixed(2)),
    longitude: Number((lonIndex * 0.02).toFixed(2)),
  };
}

/**
 * Lookup table mapping World Meteorological Organization (WMO) weather interpretation codes (0–99)
 * to parent-friendly text labels and severity priority scores.
 *
 * When an outing spans multiple hours with differing conditions, the condition with the highest
 * `priority` is featured in the summary (e.g. rain takes precedence over partly cloudy).
 */
const conditions: Record<number, { label: string; priority: number }> = {
  0: { label: "Clear skies", priority: 0 },
  1: { label: "Mainly clear", priority: 1 },
  2: { label: "Partly cloudy", priority: 2 },
  3: { label: "Cloudy", priority: 3 },
  45: { label: "Foggy", priority: 4 },
  48: { label: "Freezing fog", priority: 5 },
  51: { label: "Light drizzle", priority: 6 },
  53: { label: "Drizzle", priority: 7 },
  55: { label: "Heavy drizzle", priority: 8 },
  56: { label: "Freezing drizzle", priority: 12 },
  57: { label: "Freezing drizzle", priority: 12 },
  61: { label: "Light rain", priority: 9 },
  63: { label: "Rain", priority: 10 },
  65: { label: "Heavy rain", priority: 11 },
  66: { label: "Freezing rain", priority: 13 },
  67: { label: "Freezing rain", priority: 13 },
  71: { label: "Light snow", priority: 14 },
  73: { label: "Snow", priority: 15 },
  75: { label: "Heavy snow", priority: 16 },
  77: { label: "Snow grains", priority: 14 },
  80: { label: "Rain showers", priority: 9 },
  81: { label: "Rain showers", priority: 10 },
  82: { label: "Heavy rain showers", priority: 11 },
  85: { label: "Snow showers", priority: 15 },
  86: { label: "Heavy snow showers", priority: 16 },
  95: { label: "Thunderstorms expected", priority: 20 },
  96: { label: "Thunderstorms with hail expected", priority: 21 },
  99: { label: "Thunderstorms with hail expected", priority: 21 },
};

/**
 * Summarizes raw hourly weather forecast measurements into a concise, parent-friendly outing report.
 *
 * How this complex function works in natural English:
 * 1. Overlapping Hours Selection: Finds all hourly forecast slots from Open-Meteo that overlap
 *    with the planned outing (from departure time `start` to return time `end`).
 * 2. Continuity & Quality Check: Validates that data exists for every hour of the outing without
 *    gaps or invalid numbers. If any hour is missing or corrupted, it safely marks the weather as unavailable.
 * 3. Most Prominent Weather: Examines the weather condition codes for each hour and selects the one with
 *    the highest priority (e.g. thunderstorm or rain will take precedence over clear skies).
 * 4. Severe Hazard Detection:
 *    - Storms: WMO codes 95, 96, 99 indicate thunderstorms.
 *    - Wind: Wind gusts >= 50 km/h indicate strong winds that could affect outdoor play.
 *    Either hazard escalates the outing's severity status to `"severe"`.
 * 5. Practical Advice:
 *    - Sunscreen: Suggested if the UV index is 3 or higher, in line with Australian SunSmart guidelines.
 *    - Rain gear: Suggested if the probability of precipitation reaches 30% or higher.
 *
 * @param hourly - Raw hourly weather forecast data.
 * @param start - Outing start time in epoch milliseconds.
 * @param end - Outing end time in epoch milliseconds (including commute).
 * @returns A `MissionWeather` object with status, human-readable summary, severity, and time bounds.
 */
export function summarizeWeather(
  hourly: HourlyWeather,
  start: number,
  end: number,
): MissionWeather {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return { status: "unavailable" };
  const indices = hourly.time.flatMap((time, index) =>
    time * 1000 < end && (time + 3600) * 1000 > start ? [index] : [],
  );
  if (!indices.length) return { status: "unavailable" };
  let coveredUntil = start;
  let condition = conditions[0];
  let storm = false;
  let wind = false;
  let sunscreen = false;
  let umbrella = false;
  for (const index of indices) {
    const time = hourly.time[index] * 1000;
    const nextCondition = conditions[hourly.weather_code[index]];
    const values = [
      hourly.precipitation_probability[index],
      hourly.uv_index[index],
      hourly.wind_gusts_10m[index],
    ];
    if (
      time > coveredUntil ||
      !nextCondition ||
      values.some((value) => !Number.isFinite(value))
    )
      return { status: "unavailable" };
    coveredUntil = time + 3600000;
    if (nextCondition.priority > condition.priority) condition = nextCondition;
    storm ||= [95, 96, 99].includes(hourly.weather_code[index]);
    wind ||= hourly.wind_gusts_10m[index] >= 50;
    sunscreen ||= hourly.uv_index[index] >= 3;
    umbrella ||= hourly.precipitation_probability[index] >= 30;
  }
  if (coveredUntil < end) return { status: "unavailable" };
  const messages = [
    storm
      ? `${condition.label}.`
      : wind
        ? "Strong winds expected."
        : `${condition.label}.`,
  ];
  if (storm && wind) messages.push("Strong winds expected.");
  if (sunscreen) messages.push("Bring sunscreen.");
  if (umbrella) messages.push("Bring an umbrella or rain jacket.");
  return {
    status: "available",
    severity: storm || wind ? "severe" : "regular",
    summary: messages.join(" "),
    startsAt: new Date(start).toISOString(),
    endsAt: new Date(end).toISOString(),
  };
}
