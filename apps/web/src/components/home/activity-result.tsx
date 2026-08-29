import { Dices, MapPin, Timer } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type MockActivity = {
  title: string
  tags: string
  location: string
  duration: string
  mapsQuery: string
}

const mockActivities: MockActivity[] = [
  {
    title: "Basketball",
    tags: "SPORT · OUTDOOR",
    location: "MSAC - Melbourne Sports & Aquatic Centre",
    duration: "2 hours",
    mapsQuery: "MSAC Melbourne Sports & Aquatic Centre",
  },
  {
    title: "Nature Scavenger Hunt",
    tags: "NATURE · OUTDOOR",
    location: "Royal Botanic Gardens Melbourne",
    duration: "1 hour",
    mapsQuery: "Royal Botanic Gardens Melbourne",
  },
  {
    title: "Bike Ride",
    tags: "SPORT · OUTDOOR",
    location: "Albert Park Lake",
    duration: "45 minutes",
    mapsQuery: "Albert Park Lake Melbourne",
  },
]

type ActivityResultProps = {
  activity: MockActivity
  onTryAnother: () => void
}

function ActivityResult({ activity, onTryAnother }: ActivityResultProps) {
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.mapsQuery)}`

  return (
    <section
      aria-labelledby="activity-title"
      className="flex min-h-[calc(100svh-6.5rem)] flex-col pt-3 pb-[72px]"
    >
      <div className="text-center">
        <Badge
          className="h-7 rounded-full bg-zinc-100 px-4 text-xs font-medium tracking-wide text-zinc-600"
          variant="secondary"
        >
          {activity.tags}
        </Badge>
        <h1
          className="mt-6 text-4xl font-bold tracking-tight text-zinc-900"
          id="activity-title"
        >
          {activity.title}
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
              {activity.location}
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
              {activity.duration}
            </dd>
          </div>
        </div>
      </dl>

      <Separator className="mt-6 bg-zinc-200" />

      <div className="mt-auto space-y-3">
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
        <Button
          className="h-16 w-full rounded-full border-zinc-300 bg-white px-6 text-lg font-bold text-zinc-900 hover:bg-zinc-50 focus-visible:border-emerald-700 focus-visible:ring-emerald-600/20"
          onClick={onTryAnother}
          size="lg"
          type="button"
          variant="outline"
        >
          <Dices aria-hidden="true" />
          Try Another Activity
        </Button>
      </div>
    </section>
  )
}

export {
  ActivityResult,
  mockActivities,
  type ActivityResultProps,
  type MockActivity,
}
