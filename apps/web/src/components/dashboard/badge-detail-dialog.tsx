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
    badge.category === "Variety Tag"
      ? `Earned for themed play with the ${badge.requirement} tag.`
      : `Earned for a ${badge.milestoneDays}-day activity streak.`;

  return (
    <DialogContent className="rounded-2xl bg-[#FDF6EA] p-6 text-center sm:max-w-sm">
      <span aria-hidden="true" className="text-7xl leading-none">
        {badge.icon}
      </span>
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
