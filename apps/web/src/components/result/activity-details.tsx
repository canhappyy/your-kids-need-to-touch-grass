import { MapPin, Timer, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { getWeatherPresentation } from "@/lib/weather-presentation";
import type { MissionWeather } from "@/types/weather";

/**
 * Props for the `ActivityDetails` component.
 */
export type ActivityDetailsProps = {
  /** Location description text (e.g. venue name or "At home"). */
  locationLabel: string;
  /** Formatted total duration string including activity and walking time. */
  formattedTotalDuration: string;
  /** Formatted walking commute string (e.g. "~10 min walk each way"), or null for home activities. */
  formattedCommuteDuration: string | null;
  /** Formatted standalone activity duration string (e.g. "30 minutes"). */
  formattedDuration: string;
  /** Weather forecast details for the outing, or undefined. */
  weather?: MissionWeather;
  /** Whether the activity is home-based or venue-free. When true, weather details are hidden. */
  isHomeBased?: boolean;
};

/**
 * Metadata list displaying location details, time breakdowns, and weather conditions.
 *
 * @param props - Component properties configuring location, duration, and weather.
 */
export function ActivityDetails({
  locationLabel,
  formattedDuration,
  formattedTotalDuration,
  formattedCommuteDuration,
  weather,
  isHomeBased = false,
}: ActivityDetailsProps) {
  const showWeather = !isHomeBased;
  const {
    Icon: WeatherIcon,
    headline,
    isAvailable,
    isSevere,
    tips,
  } = getWeatherPresentation(weather);

  return (
    <dl className="mt-7 space-y-6">
      <div className="grid grid-cols-[24px_1fr_24px] items-center gap-3">
        <MapPin
          aria-hidden="true"
          className="size-5 text-zinc-500"
          strokeWidth={1.75}
        />
        <div className="col-start-2 text-center">
          <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            Location
          </dt>
          <dd className="mt-1 text-lg leading-tight font-semibold text-zinc-900">
            {locationLabel}
          </dd>
        </div>
      </div>

      <div className="grid grid-cols-[24px_1fr_24px] items-center gap-3">
        <Timer
          aria-hidden="true"
          className="size-5 text-zinc-500"
          strokeWidth={1.75}
        />
        <div className="col-start-2 text-center">
          <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            {formattedCommuteDuration !== null
              ? "Estimated total time"
              : "Duration"}
          </dt>
          <dd className="mt-1 text-lg leading-tight font-semibold text-zinc-900">
            {formattedTotalDuration}
          </dd>
          {formattedCommuteDuration !== null && (
            <dd className="mt-2 space-y-1 text-sm text-zinc-600">
              <p>
                {formattedDuration} activity · ~{formattedCommuteDuration}{" "}
                round-trip walk
              </p>
            </dd>
          )}
        </div>
      </div>

      {showWeather && (
        <div className="grid grid-cols-[24px_1fr_24px] items-center gap-3">
          <WeatherIcon
            aria-hidden="true"
            className={cn(
              "size-5",
              isSevere ? "text-amber-600" : "text-zinc-500",
            )}
            strokeWidth={1.75}
          />
          <div className="col-start-2 text-center">
            <dt className="flex items-center justify-center gap-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">
              <span>Weather</span>
              {isSevere && (
                <TriangleAlert
                  aria-label="Weather caution"
                  className="size-3.5 text-amber-600"
                />
              )}
            </dt>
            <dd className="mt-1 text-lg leading-tight font-semibold text-zinc-900">
              {headline}
            </dd>
            {tips.length > 0 && (
              <dd className="mt-2 space-y-1 text-sm text-zinc-600">
                {tips.map((tip, index) => (
                  <p key={index}>{tip}</p>
                ))}
              </dd>
            )}
            {isAvailable && (
              <dd className="mt-2">
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-20 text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  Weather data by Open-Meteo
                </a>
              </dd>
            )}
          </div>
        </div>
      )}
    </dl>
  );
}
