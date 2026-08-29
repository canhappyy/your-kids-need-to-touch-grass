import { Dices, MapPin, Timer } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Recommendation } from "@/types/recommendation"

type ActivityResultProps = {
  recommendation: Recommendation
  isRetrying?: boolean
  onBackToSearch: () => void
  onTryAnother: () => void
}

function formatDuration(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  if (!hours) return `${minutes} minutes`

  const hourLabel = `${hours} ${hours === 1 ? "hour" : "hours"}`
  return minutes ? `${hourLabel} ${minutes} minutes` : hourLabel
}

function ActivityResult({
  recommendation,
  isRetrying = false,
  onBackToSearch,
  onTryAnother,
}: ActivityResultProps) {
  const locationLabel = recommendation.venue
    ? recommendation.venue.name
    : recommendation.missionType === "Home-Based"
      ? "At home"
      : "Anywhere"
  const directionsUrl = recommendation.venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${recommendation.venue.latitude},${recommendation.venue.longitude}`)}`
    : null

  return (
    <section
      aria-labelledby="activity-title"
      className="flex min-h-[calc(100svh-6.5rem)] flex-col pt-3 pb-[72px]"
    >
      <div className="text-center">
        <div
          aria-label="Why this mission matches"
          className="flex flex-wrap justify-center gap-2"
        >
          {recommendation.reasons.map((reason) => (
            <Badge
              className="min-h-7 rounded-full bg-zinc-100 px-4 py-1 text-xs font-medium tracking-wide text-zinc-600"
              key={reason.kind}
              variant="secondary"
            >
              {reason.label}
            </Badge>
          ))}
        </div>
        <h1
          className="mt-6 text-4xl font-bold tracking-tight text-zinc-900"
          id="activity-title"
        >
          {recommendation.title}
        </h1>
      </div>

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
              Duration
            </dt>
            <dd className="mt-1 text-lg leading-tight font-semibold text-zinc-900">
              {formatDuration(recommendation.durationMinutes)}
            </dd>
          </div>
        </div>
      </dl>

      <Separator className="mt-6 bg-zinc-200" />

      <div className="mt-auto space-y-3">
        {directionsUrl && (
          <a
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-16 w-full rounded-full bg-emerald-600 px-6 text-lg font-bold text-white shadow-[0_10px_24px_rgba(5,150,90,0.25)] hover:bg-emerald-700 focus-visible:border-emerald-700 focus-visible:ring-emerald-600/30"
            )}
            href={directionsUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Get Directions
          </a>
        )}
        <Button
          className="h-16 w-full rounded-full border-zinc-300 bg-white px-6 text-lg font-bold text-zinc-900 hover:bg-zinc-50 focus-visible:border-emerald-700 focus-visible:ring-emerald-600/20"
          disabled={isRetrying}
          onClick={onTryAnother}
          size="lg"
          type="button"
          variant="outline"
        >
          <Dices aria-hidden="true" />
          {isRetrying ? "Finding Another…" : "Try Another Activity"}
        </Button>
        <Button
          className="h-16 w-full rounded-full border-zinc-300 bg-white px-6 text-lg font-bold text-zinc-900 hover:bg-zinc-50 focus-visible:border-emerald-700 focus-visible:ring-emerald-600/20"
          onClick={onBackToSearch}
          size="lg"
          type="button"
          variant="outline"
        >
          Back to Search
        </Button>
      </div>
    </section>
  )
}

export { ActivityResult, type ActivityResultProps }
