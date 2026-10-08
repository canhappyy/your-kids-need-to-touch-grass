import Image from "next/image";
import { Sparkles, Trophy } from "lucide-react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MilestoneBadge } from "@/types/reward";

type BadgeDetailDialogProps = {
  badge: MilestoneBadge;
};

/** Details for one earned Australian wildlife badge. */
export function BadgeDetailDialog({ badge }: BadgeDetailDialogProps) {
  const description =
    badge.description ??
    (badge.milestoneDays > 0
      ? `Earned for a ${badge.milestoneDays}-day activity streak.`
      : badge.requirement ?? "Activity goal completed.");

  return (
    <DialogContent className="rounded-2xl border-[#D9C99E] bg-[#FDF6EA] p-6 text-center sm:max-w-sm">
      <div className="mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#E4633C] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
        <Trophy aria-hidden="true" className="size-3.5" />
        Badge earned
        <Sparkles aria-hidden="true" className="size-3.5" />
      </div>
      {badge.icon.endsWith(".svg") ? (
        <Image
          alt=""
          className="mx-auto size-28 object-contain"
          height={112}
          src={`/badges/${badge.icon}`}
          width={112}
        />
      ) : (
        <span aria-hidden="true" className="text-7xl leading-none">
          {badge.icon}
        </span>
      )}
      <DialogHeader className="items-center">
        <DialogTitle className="text-xl font-bold text-zinc-800">
          {badge.speciesName} badge earned
        </DialogTitle>
        <DialogDescription className="text-zinc-600">
          {description}
        </DialogDescription>
      </DialogHeader>
    </DialogContent>
  );
}

export type { BadgeDetailDialogProps };
