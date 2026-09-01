import { MapPin, Timer } from "lucide-react"

type ActivityDetailsProps = {
  locationLabel: string
  formattedDuration: string
}

export function ActivityDetails({
  locationLabel,
  formattedDuration,
}: ActivityDetailsProps) {
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
            Duration
          </dt>
          <dd className="mt-1 text-lg leading-tight font-semibold text-zinc-900">
            {formattedDuration}
          </dd>
        </div>
      </div>
    </dl>
  )
}
