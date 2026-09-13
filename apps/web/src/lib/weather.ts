import type { HourlyWeather, MissionWeather } from "@/types/weather";

export const WEATHER_TTL_SECONDS = 1800;

export function getWeatherCell(latitude: number, longitude: number) {
  const latIndex = Math.round(latitude / 0.02);
  const lonIndex = Math.round(longitude / 0.02);
  return {
    key: `playgo:weather:v1:${latIndex}:${lonIndex}`,
    latitude: Number((latIndex * 0.02).toFixed(2)),
    longitude: Number((lonIndex * 0.02).toFixed(2)),
  };
}

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
