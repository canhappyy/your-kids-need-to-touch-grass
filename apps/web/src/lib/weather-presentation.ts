import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { MissionWeather } from "@/types/weather";

/**
 * Formatted presentation data for rendering weather in the activity details UI.
 */
export type WeatherPresentation = {
  /** Whether weather forecast data is available for the outing. */
  isAvailable: boolean;
  /** Whether severe weather warnings (e.g. thunderstorm or strong wind) apply. */
  isSevere: boolean;
  /** Contextual weather Lucide icon based on condition (sunny, rainy, cloudy, etc.). */
  Icon: LucideIcon;
  /** Primary condition headline (e.g. "Clear skies", "Cloudy", "Rain", "Not listed"). */
  headline: string;
  /** Secondary packing or preparation tips (e.g. ["Bring a rain jacket."]). */
  tips: string[];
};

/**
 * Determines the appropriate Lucide weather icon based on WMO code and summary keywords.
 *
 * @param weather - Mission weather data object.
 * @returns A Lucide icon component representing the condition.
 */
export function getWeatherIcon(weather?: MissionWeather): LucideIcon {
  if (!weather || weather.status !== "available") {
    return CloudSun;
  }

  const { weatherCode, summary } = weather;

  if (typeof weatherCode === "number") {
    // 0: Clear sky, 1: Mainly clear
    if (weatherCode === 0 || weatherCode === 1) return Sun;
    // 2: Partly cloudy
    if (weatherCode === 2) return CloudSun;
    // 3: Overcast / Cloudy
    if (weatherCode === 3) return Cloud;
    // 45, 48: Fog
    if (weatherCode === 45 || weatherCode === 48) return CloudFog;
    // 51-57: Drizzle
    if (weatherCode >= 51 && weatherCode <= 57) return CloudDrizzle;
    // 61-67: Rain, 80-82: Rain showers
    if (
      (weatherCode >= 61 && weatherCode <= 67) ||
      (weatherCode >= 80 && weatherCode <= 82)
    ) {
      return CloudRain;
    }
    // 71-77: Snow, 85-86: Snow showers
    if (
      (weatherCode >= 71 && weatherCode <= 77) ||
      (weatherCode >= 85 && weatherCode <= 86)
    ) {
      return CloudSnow;
    }
    // 95-99: Thunderstorms
    if (weatherCode >= 95) return CloudLightning;
  }

  // Fallback to text analysis of summary if code is missing or undefined
  const lower = summary.toLowerCase();
  if (lower.includes("thunderstorm")) return CloudLightning;
  if (lower.includes("snow")) return CloudSnow;
  if (lower.includes("drizzle")) return CloudDrizzle;
  if (lower.includes("rain") || lower.includes("shower")) return CloudRain;
  if (lower.includes("wind")) return Wind;
  if (lower.includes("fog")) return CloudFog;
  if (lower.includes("partly cloudy")) return CloudSun;
  if (lower.includes("cloudy") || lower.includes("overcast")) return Cloud;
  if (lower.includes("clear") || lower.includes("sun")) return Sun;

  return CloudSun;
}

/**
 * Normalizes and formats raw weather into structured presentation data for ActivityDetails.
 *
 * @param weather - Optional mission weather data.
 * @returns Structured presentation model with icon, headline, tips, and severity status.
 */
export function getWeatherPresentation(
  weather?: MissionWeather,
): WeatherPresentation {
  if (!weather || weather.status !== "available") {
    return {
      isAvailable: false,
      isSevere: false,
      Icon: CloudSun,
      headline: "Not listed",
      tips: [],
    };
  }

  const sentences = weather.summary
    .split(/\.\s+/)
    .map((s) => s.trim().replace(/\.+$/, ""))
    .filter(Boolean);

  const headline = sentences[0] || "Not listed";
  const tips = sentences.slice(1).map((tip) => (tip.endsWith(".") ? tip : `${tip}.`));

  return {
    isAvailable: true,
    isSevere: weather.severity === "severe",
    Icon: getWeatherIcon(weather),
    headline,
    tips,
  };
}
