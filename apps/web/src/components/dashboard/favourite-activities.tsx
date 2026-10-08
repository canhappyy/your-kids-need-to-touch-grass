import { Progress, ProgressLabel } from "@/components/ui/progress";
import type { VarietyTagCount } from "@/types/dashboard";

/**
 * Properties for the `FavouriteActivities` component.
 */
type FavouriteActivitiesProps = {
  /** Array of variety tags ranked descending by frequency of completion. */
  tags: VarietyTagCount[];
};

/**
 * Sequential color palette used to tint the progress bars for different play categories.
 */
const tagColours = [
  "[&_[data-slot=progress-indicator]]:bg-[#E4633C]",
  "[&_[data-slot=progress-indicator]]:bg-[#F5C24C]",
  "[&_[data-slot=progress-indicator]]:bg-[#7B8FD6]",
  "[&_[data-slot=progress-indicator]]:bg-[#93AB63]",
  "[&_[data-slot=progress-indicator]]:bg-[#F0B6A3]",
  "[&_[data-slot=progress-indicator]]:bg-[#22304A]",
] as const;

/**
 * Ranked list of the child's favourite activity variety tags (e.g. "Nature", "Ball Games", "Creative Play").
 *
 * Helps parents see what types of play their child naturally gravitates toward.
 * Each category is rendered as a proportional bar relative to the most-frequent tag,
 * with count metrics and high-contrast color coding.
 *
 * @param props - Component properties containing the ranked list of tag counts.
 * @returns The rendered list of favourite activity categories.
 */
export function FavouriteActivities({ tags }: FavouriteActivitiesProps) {
  // If the user hasn't logged any activities yet, display an empty state encouragement
  if (tags.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        Log activities to discover favourite play types.
      </p>
    );
  }


  const maximum = tags[0]?.count ?? 1;

  return (
    <div className="space-y-2">
      {tags.map((tag, index) => (
        <Progress
          aria-valuetext={tag.count + " logged activities"}
          className={`gap-1 ${tagColours[index % tagColours.length]} [&_[data-slot=progress-track]]:h-2`}
          key={tag.name}
          value={(tag.count / maximum) * 100}
        >
          <ProgressLabel className="text-xs">{tag.name}</ProgressLabel>
          <span className="ml-auto text-xs tabular-nums text-zinc-500">
            {tag.count}
          </span>
        </Progress>
      ))}
    </div>
  );
}

export type { FavouriteActivitiesProps };
