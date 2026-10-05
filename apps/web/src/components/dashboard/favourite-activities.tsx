import { Progress, ProgressLabel } from "@/components/ui/progress";
import type { VarietyTagCount } from "@/types/dashboard";

type FavouriteActivitiesProps = {
  tags: VarietyTagCount[];
};

/** Ranked local activity-variety counts. */
export function FavouriteActivities({ tags }: FavouriteActivitiesProps) {
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
      {tags.map((tag) => (
        <Progress
          aria-valuetext={tag.count + " logged activities"}
          className="gap-1 [&_[data-slot=progress-indicator]]:bg-[#7B8FD6] [&_[data-slot=progress-track]]:h-2"
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
