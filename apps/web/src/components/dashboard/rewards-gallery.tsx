import { Lock } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { MILESTONE_BADGES } from "@/lib/rewards";
import type { MilestoneBadge, RewardBadgeId } from "@/types/reward";
import { BadgeDetailDialog } from "./badge-detail-dialog";

type RewardsGalleryProps = {
  unlockedBadgeIds: string[];
  badges?: readonly MilestoneBadge[];
};

function BadgeFace({ badge, unlocked }: { badge: MilestoneBadge; unlocked: boolean }) {
  const subtitle =
    badge.category === "Variety Tag"
      ? `${badge.requirement} play`
      : `${badge.milestoneDays} day streak`;

  return (
    <>
      <span
        aria-hidden="true"
        className={unlocked ? "text-5xl" : "grayscale text-5xl opacity-45"}
      >
        {badge.icon}
      </span>
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
    </>
  );
}

/** All wildlife milestones, with earned badges opening a detail dialog. */
export function RewardsGallery({
  unlockedBadgeIds,
  badges = MILESTONE_BADGES,
}: RewardsGalleryProps) {
  const unlocked = new Set(unlockedBadgeIds);

  return (
    <section aria-labelledby="wildlife-rewards-heading" className="mt-8">
      <h2
        className="text-xl font-bold text-zinc-800 sm:text-2xl"
        id="wildlife-rewards-heading"
      >
        Wildlife rewards
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Celebrate active-day streaks with Australian species badges.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                className="flex min-h-44 cursor-not-allowed flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white/35 px-3 py-5 opacity-75"
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
                className="flex min-h-44 w-full flex-col items-center justify-center rounded-xl border border-[#93AB63] bg-white/65 px-3 py-5 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] focus-visible:ring-offset-2"
                render={<button type="button" />}
              >
                <BadgeFace badge={badge} unlocked />
              </DialogTrigger>
              <BadgeDetailDialog badge={badge} />
            </Dialog>
          );
        })}
      </div>
    </section>
  );
}

export type { RewardsGalleryProps };
