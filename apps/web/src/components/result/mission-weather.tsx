import { CloudSun, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MissionWeather as Weather } from "@/types/weather";

/**
 * Props for the `MissionWeather` component.
 */
export type MissionWeatherProps = {
  /**
   * The enriched weather forecast object for the selected activity outing,
   * or undefined if weather data has not yet been loaded.
   */
  weather?: Weather;
};

/**
 * Displays parent-friendly weather conditions and packing recommendations for an outdoor mission.
 *
 * How it presents information:
 * - Regular Weather (`severity === "regular"`): Shows standard card styling with a sun/cloud icon,
 *   a concise summary (e.g. "Mainly clear. Bring sunscreen."), and the outing time window.
 * - Severe Weather (`severity === "severe"`): Displays prominent high-contrast amber styling
 *   (`border-amber-700 bg-amber-50`) with an alert triangle icon and a "Weather caution" heading
 *   to alert parents of potential thunderstorms or dangerous wind gusts.
 * - Unavailable / Indoor: Renders a gentle fallback ("Weather: not listed") so the UI layout remains clean
 *   without distracting the user.
 * - Time Formatting: Times are displayed in Melbourne time (`Australia/Melbourne`) reflecting the local time
 *   for Victorian families.
 * - Attribution: Provides a link to Open-Meteo as required by the weather data provider terms.
 *
 * @param props - Component properties containing the optional `weather` payload.
 */
export function MissionWeather({ weather }: MissionWeatherProps) {
  const available = weather?.status === "available";
  const severe = available && weather.severity === "severe";
  const Icon = severe ? TriangleAlert : CloudSun;
  const formatTime = (date: string) =>
    new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Melbourne",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));

  return (
    <Card
      className={cn(
        "mt-6",
        severe && "border-2 border-amber-700 bg-amber-50 text-amber-950",
      )}
    >
      <CardContent className="space-y-3 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          Weather for your outing
        </h2>
        {available ? (
          <>
            {severe && <p className="font-bold">Weather caution</p>}
            <p className="text-sm leading-relaxed">{weather.summary}</p>
            <p className="text-xs text-zinc-600">
              Leaving now, including your return trip.
            </p>
            <p className="text-xs text-zinc-600">
              {formatTime(weather.startsAt)} – {formatTime(weather.endsAt)}{" "}
              (Melbourne time)
            </p>
          </>
        ) : (
          <p className="text-sm text-zinc-600">Weather: not listed</p>
        )}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-8 items-center text-xs underline underline-offset-4"
        >
          Weather data by Open-Meteo
        </a>
      </CardContent>
    </Card>
  );
}
