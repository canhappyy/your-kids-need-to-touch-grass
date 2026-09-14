import { MapPin, Timer } from "lucide-react";

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
};

/**
 * Metadata list displaying location details and time breakdowns (commute vs activity duration).
 *
 * @param props - Component properties configuring location and duration strings.
 */
export function ActivityDetails({
  locationLabel,
  formattedDuration,
  formattedTotalDuration,
  formattedCommuteDuration,
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
              <p className="text-xs text-zinc-500">
                Walking estimate from selected suburb/postcode, including the
                return trip.
              </p>
            </dd>
          )}
        </div>
      </div>
    </dl>
  );
}
