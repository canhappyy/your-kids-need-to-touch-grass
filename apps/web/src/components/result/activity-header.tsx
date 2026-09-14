import { Badge } from "@/components/ui/badge";
import type { MatchReason } from "@/types/recommendation";

/**
 * Props for the `ActivityHeader` component.
 */
export type ActivityHeaderProps = {
  /** The title of the recommended activity mission. */
  title: string;
  /** Array of structured match reason badges explaining why this activity fits search criteria. */
  reasons: MatchReason[];
  /** Human-readable age suitability label (e.g. "Ages 5-7, 8-9"). */
  agesLabel: string;
  /** Formatted duration label (e.g. "30 minutes"). */
  formattedDuration: string;
  /** Formatted supervision label ("Independent play" or "Adult supervision"). */
  formattedSupervision: string;
  /** Heading element used for the mission title. */
  headingLevel?: "h1" | "h2";
  /** DOM identifier used by the surrounding labelled region. */
  titleId?: string;
  /** Uses smaller spacing inside a chained activity card. */
  compact?: boolean;
};

/**
 * Header section of the activity result view displaying match reason badges, mission title, and key metadata.
 *
 * @param props - Component properties configuring title, badges, and metadata labels.
 */
export function ActivityHeader({
  title,
  reasons,
  agesLabel,
  formattedDuration,
  formattedSupervision,
  headingLevel = "h1",
  titleId = "activity-title",
  compact = false,
}: ActivityHeaderProps) {
  const Heading = headingLevel;

  return (
    <div className="text-center">
      <div
        aria-label="Why this mission matches"
        className="flex flex-wrap justify-center gap-2"
      >
        {reasons.map((reason) => (
          <Badge
            className="min-h-7 rounded-full bg-zinc-100 px-4 py-1 text-xs font-medium tracking-wide text-zinc-600"
            key={reason.kind}
            variant="secondary"
          >
            {reason.label}
          </Badge>
        ))}
      </div>
      <Heading
        className={
          compact
            ? "mt-4 text-2xl font-bold tracking-tight text-zinc-900"
            : "mt-6 text-4xl font-bold tracking-tight text-zinc-900"
        }
        id={titleId}
      >
        {title}
      </Heading>
      <div
        aria-label="Mission details"
        className="mt-4 flex flex-wrap justify-center gap-2"
      >
        <Badge
          className="border-transparent bg-[#F5C24C38] text-zinc-800"
          variant="outline"
        >
          Ages {agesLabel}
        </Badge>
        <Badge
          className="border-transparent bg-[#F5C24C38] text-zinc-800"
          variant="outline"
        >
          {formattedDuration}
        </Badge>
        <Badge
          className="border-transparent bg-[#F5C24C38] text-zinc-800"
          variant="outline"
        >
          {formattedSupervision}
        </Badge>
      </div>
    </div>
  );
}
