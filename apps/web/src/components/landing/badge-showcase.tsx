import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShowcaseBadge = {
  name: string;
  role: string;
  icon: string;
  bg: string;
  desc: string;
  isLocked: boolean;
};

const showcaseBadges: ShowcaseBadge[] = [
  {
    name: "Platypus",
    role: "The Curious Explorer",
    icon: "/badges/platypus.svg",
    bg: "border-teal-200/70 bg-teal-50/70",
    desc: "Awarded for exploring new trails and outdoor water spots.",
    isLocked: false,
  },
  {
    name: "Sugar Glider",
    role: "The High Flyer",
    icon: "/badges/sugar_glider.svg",
    bg: "border-sky-200/70 bg-sky-50/70",
    desc: "Earned by completing high-energy jumping and climbing games.",
    isLocked: false,
  },
  {
    name: "Koala",
    role: "The Nature Guardian",
    icon: "/badges/koala_locked.svg",
    bg: "border-dashed border-zinc-300 bg-zinc-50/70 opacity-80",
    desc: "Unlock by going on mindful nature walks and tree spotting.",
    isLocked: true,
  },
  {
    name: "Quokka",
    role: "The Joyful Spirit",
    icon: "/badges/quokka_locked.svg",
    bg: "border-dashed border-zinc-300 bg-zinc-50/70 opacity-80",
    desc: "Unlock through cooperative family games and active fun.",
    isLocked: true,
  },
];

/**
 * Wildlife Badge Showcase section displaying collectible rewards.
 */
export function BadgeShowcase() {
  return (
    <section className="py-8 sm:py-12" aria-labelledby="badges-showcase-heading">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#93AB63]/15 px-3 py-0.5 text-xs font-semibold text-[#5B7330]">
          <Sparkles className="size-3" aria-hidden="true" />
          <span>Reward Motivation</span>
        </div>
        <h2
          id="badges-showcase-heading"
          className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl"
        >
          Collect Victorian Wildlife Badges
        </h2>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base max-w-lg mx-auto">
          Every active mission completed helps children discover and unlock native Australian animal companions.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-4xl mx-auto">
        {showcaseBadges.map((badge) => (
          <Card
            key={badge.name}
            className={cn(
              "border text-center shadow-2xs transition-all",
              badge.bg,
              badge.isLocked ? "" : "hover:scale-[1.02] hover:shadow-xs",
            )}
          >
            <CardContent className="flex flex-col items-center p-4">
              <div className="relative size-16 sm:size-20 drop-shadow-xs">
                <Image
                  src={badge.icon}
                  alt={badge.name}
                  width={80}
                  height={80}
                  className={cn(
                    "size-full object-contain",
                    badge.isLocked ? "grayscale opacity-45" : "",
                  )}
                />
              </div>
              <h3
                className={cn(
                  "mt-2 text-sm font-bold",
                  badge.isLocked ? "text-zinc-600" : "text-zinc-900",
                )}
              >
                {badge.name}
              </h3>
              <p
                className={cn(
                  "text-[11px] font-medium",
                  badge.isLocked ? "text-zinc-400" : "text-[#728A46]",
                )}
              >
                {badge.role}
              </p>
              <p className="mt-1.5 hidden text-[11px] text-zinc-500 sm:block leading-tight line-clamp-2">
                {badge.desc}
              </p>
              {badge.isLocked ? (
                <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                  <Lock aria-hidden="true" className="size-3" />
                  <span>Locked</span>
                </span>
              ) : (
                <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#728A46]">
                  <span>Unlocked</span>
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "min-h-11 rounded-full text-xs sm:text-sm font-semibold text-[#728A46] hover:bg-[#93AB63]/10 flex items-center gap-1.5 px-4 py-2",
          )}
        >
          <span>View badge collection in Parent Dashboard</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
