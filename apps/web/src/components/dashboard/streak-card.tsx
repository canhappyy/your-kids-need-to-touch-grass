import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RewardState } from "@/types/reward";

type StreakCardProps = {
  rewards: RewardState;
};

/** Current consecutive activity streak with non-judgmental guidance. */
export function StreakCard({ rewards }: StreakCardProps) {
  const active = rewards.currentStreak > 0;

  return (
    <Card
      className="mb-6 border border-[#93AB63]/60 bg-white/55 shadow-sm ring-0"
      data-streak-active={active}
    >
      <CardContent className="flex items-center gap-4 sm:gap-5">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full",
            active
              ? "bg-[#E4633C]/15 text-[#E4633C]"
              : "bg-zinc-200/70 text-zinc-400",
          )}
        >
          <Flame
            aria-hidden="true"
            className={cn("size-6", active && "fill-current")}
          />
        </span>
        <div>
          <p className="text-xl font-bold text-zinc-800 tabular-nums sm:text-2xl">
            {rewards.currentStreak} day streak
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            {active
              ? "Each active day builds a great play habit!"
              : "Complete a mission today to start a streak."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export type { StreakCardProps };
