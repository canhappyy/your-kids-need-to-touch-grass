import { CloudSun, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MissionWeather as Weather } from "@/types/weather";

export function MissionWeather({ weather }: { weather?: Weather }) {
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
