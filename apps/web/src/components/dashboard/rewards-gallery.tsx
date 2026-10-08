import { Lock } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { MILESTONE_BADGES } from "@/lib/rewards";
import type { MilestoneBadge } from "@/types/reward";
import { BadgeDetailDialog } from "./badge-detail-dialog";

type RewardsGalleryProps = {
  unlockedBadgeIds: string[];
  badges?: readonly MilestoneBadge[];
  showHeading?: boolean;
};

function BadgeFace({ badge, unlocked }: { badge: MilestoneBadge; unlocked: boolean }) {
  const subtitle = getBadgeExplanation(badge);

  return (
    <>
      {badge.icon.endsWith(".svg") ? (
        <Image
          alt=""
          className={unlocked ? "size-16 object-contain" : "size-16 object-contain grayscale opacity-45"}
          height={64}
          src={`/badges/${unlocked || !badge.lockedIcon ? badge.icon : badge.lockedIcon}`}
          width={64}
        />
      ) : (
        <span
          aria-hidden="true"
          className={unlocked ? "text-5xl" : "grayscale text-5xl opacity-45"}
        >
          {badge.icon}
        </span>
      )}
      <span className="mt-3 font-semibold text-zinc-800">
        {badge.speciesName}
      </span>
      <span className="mt-1 text-xs text-zinc-500">
        {subtitle}
      </span>
      {!unlocked && (
        <span className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-400">
          <Lock aria-hidden="true" className="size-3" /> Locked
        </span>
      )}
      {unlocked && (
        <span className="mt-2 text-xs font-semibold text-[#728A46]">
          Earned
        </span>
      )}
    </>
  );
}

function getBadgeExplanation(badge: MilestoneBadge): string {
  if (badge.targetMetric === "consecutive_days") {
    return `Complete activities for ${badge.targetValue} consecutive days`;
  }
  if (badge.milestoneDays > 0) {
    return `${badge.milestoneDays} day streak`;
  }
  if (badge.targetMetric === "duration_minutes") {
    return `Complete ${badge.targetValue} minutes of activity`;
  }
  if (badge.targetMetric === "total_activities") {
    return `Complete ${badge.targetValue} activity`;
  }
  if (badge.targetMetric === "daily_activities") {
    return `Complete ${badge.targetValue} activities in one day`;
  }
  return `Complete a ${badge.targetValue} activity`;
}

/** All wildlife milestones, with earned badges opening a detail dialog. */
export function RewardsGallery({
  unlockedBadgeIds,
  badges = MILESTONE_BADGES,
  showHeading = true,
}: RewardsGalleryProps) {
  const unlocked = new Set(unlockedBadgeIds);

  const gallery = (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {badges.map((badge) => {
        const isUnlocked =
          unlocked.has(badge.id) ||
          (badge.id === "kangaroo" && unlocked.has("red-kangaroo")) ||
          (badge.id === "red-kangaroo" && unlocked.has("kangaroo")) ||
          (badge.id === "green-sea-turtle" && unlocked.has("green-turtle")) ||
          (badge.id === "green-turtle" && unlocked.has("green-sea-turtle"));

        if (!isUnlocked) {
          return (
            <button
              aria-label={`${badge.speciesName} badge locked`}
              className="flex min-h-32 cursor-not-allowed flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white/35 px-2 py-3 opacity-75"
              disabled
              key={badge.id}
              type="button"
            >
              <BadgeFace badge={badge} unlocked={false} />
            </button>
          );
        }

        return (
          <Dialog key={badge.id}>
            <DialogTrigger
              aria-label={`View ${badge.speciesName} badge`}
              className="flex min-h-32 w-full flex-col items-center justify-center rounded-xl border border-[#93AB63] bg-white/65 px-2 py-3 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] focus-visible:ring-offset-2"
              render={<button type="button" />}
            >
              <BadgeFace badge={badge} unlocked />
            </DialogTrigger>
            <BadgeDetailDialog badge={badge} />
          </Dialog>
        );
      })}
    </div>
  );

  if (!showHeading) return gallery;

  return (
    <section aria-labelledby="wildlife-rewards-heading">
      <h2
        className="text-xl font-bold text-zinc-800 sm:text-2xl"
        id="wildlife-rewards-heading"
      >
        Wildlife rewards
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Earn Australian species badges by reaching activity goals.
      </p>
      <div className="mt-4">{gallery}</div>
    </section>
  );
}

export type { RewardsGalleryProps };
