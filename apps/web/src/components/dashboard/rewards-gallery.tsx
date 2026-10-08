import { Lock, Sparkles, Target, Trophy } from "lucide-react";
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

function BadgeFace({
  badge,
  unlocked,
}: {
  badge: MilestoneBadge;
  unlocked: boolean;
}) {
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
      {unlocked ? (
        <span className="mt-3 text-center font-semibold leading-tight text-zinc-800">
          {badge.speciesName}
        </span>
      ) : null}
      <span className="mt-1 text-center text-xs leading-tight text-zinc-500">
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

function isBadgeUnlocked(badge: MilestoneBadge, unlocked: Set<string>): boolean {
  return (
    unlocked.has(badge.id) ||
    (badge.id === "kangaroo" && unlocked.has("red-kangaroo")) ||
    (badge.id === "red-kangaroo" && unlocked.has("kangaroo")) ||
    (badge.id === "green-sea-turtle" && unlocked.has("green-turtle")) ||
    (badge.id === "green-turtle" && unlocked.has("green-sea-turtle"))
  );
}

/** All wildlife milestones, with earned badges opening a detail dialog. */
export function RewardsGallery({
  unlockedBadgeIds,
  badges = MILESTONE_BADGES,
  showHeading = true,
}: RewardsGalleryProps) {
  const unlocked = new Set(unlockedBadgeIds);
  const earnedBadges = badges.filter((badge) => isBadgeUnlocked(badge, unlocked));
  const lockedBadges = badges.filter((badge) => !isBadgeUnlocked(badge, unlocked));
  const completionPercent =
    badges.length === 0 ? 0 : Math.round((earnedBadges.length / badges.length) * 100);

  const renderBadge = (badge: MilestoneBadge, isUnlocked: boolean) => {
    const cardClassName = isUnlocked
      ? "group relative flex min-h-36 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#93AB63] bg-gradient-to-b from-white/90 to-[#F4F7E9] px-2 py-4 shadow-[0_3px_0_#B8C98A] transition hover:-translate-y-0.5 hover:shadow-[0_4px_0_#B8C98A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] focus-visible:ring-offset-2"
      : "relative flex min-h-36 cursor-not-allowed flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 px-2 py-4 opacity-80";

    if (!isUnlocked) {
      return (
        <button
          aria-label={`Locked reward badge. ${getBadgeExplanation(badge)}`}
          className={cardClassName}
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
          className={cardClassName}
          render={<button type="button" />}
        >
          <Sparkles
            aria-hidden="true"
            className="absolute right-2 top-2 size-3.5 text-[#E4633C] opacity-70"
          />
          <BadgeFace badge={badge} unlocked />
        </DialogTrigger>
        <BadgeDetailDialog badge={badge} />
      </Dialog>
    );
  };

  const gallery = (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#D9C99E] bg-gradient-to-r from-[#FFF8E8] to-[#F4F7E9] p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E4633C] text-white shadow-sm">
            <Trophy aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-zinc-800">Wildlife collection</p>
              <p className="text-sm font-bold tabular-nums text-[#728A46]">
                {earnedBadges.length}/{badges.length}
              </p>
            </div>
            <div
              aria-label={`${completionPercent}% of reward badges earned`}
              className="mt-2 h-2 overflow-hidden rounded-full bg-white/80"
              role="progressbar"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={completionPercent}
            >
              <div
                className="h-full rounded-full bg-[#93AB63] transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-zinc-600">
              {completionPercent === 100
                ? "Every species badge is yours!"
                : "Keep completing activities to discover them all."}
            </p>
          </div>
        </div>
      </div>

      {earnedBadges.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Trophy aria-hidden="true" className="size-4 text-[#E4633C]" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-700">
              Earned
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {earnedBadges.map((badge) => renderBadge(badge, true))}
          </div>
        </div>
      ) : null}

      {lockedBadges.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Target aria-hidden="true" className="size-4 text-[#728A46]" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-700">
              Next challenges
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {lockedBadges.map((badge) => renderBadge(badge, false))}
          </div>
        </div>
      ) : null}
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
