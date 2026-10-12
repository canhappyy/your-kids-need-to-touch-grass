import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const showcaseBadges = [
  {
    name: "Platypus",
    role: "The Curious Explorer",
    icon: "/badges/platypus.svg",
    bg: "bg-teal-50/70 border-teal-200/60",
    desc: "Awarded for exploring new trails and outdoor water spots.",
  },
  {
    name: "Sugar Glider",
    role: "The High Flyer",
    icon: "/badges/sugar_glider.svg",
    bg: "bg-sky-50/70 border-sky-200/60",
    desc: "Earned by completing high-energy jumping and climbing games.",
  },
  {
    name: "Koala",
    role: "The Nature Guardian",
    icon: "/badges/koala.svg",
    bg: "bg-amber-50/70 border-amber-200/60",
    desc: "Unlocked through mindful nature walks and tree spotting.",
  },
  {
    name: "Quokka",
    role: "The Joyful Spirit",
    icon: "/badges/quokka.svg",
    bg: "bg-rose-50/70 border-rose-200/60",
    desc: "Celebrates teamwork, laughter, and family cooperative play.",
  },
  {
    name: "Kookaburra",
    role: "The Trail Laugher",
    icon: "/badges/kookaburra.svg",
    bg: "bg-emerald-50/70 border-emerald-200/60",
    desc: "Awarded for morning energetic bursts and outdoor sports.",
  },
  {
    name: "Echidna",
    role: "The Steady Pacer",
    icon: "/badges/echidna.svg",
    bg: "bg-orange-50/70 border-orange-200/60",
    desc: "Honors perseverance, step milestones, and endurance trails.",
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

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {showcaseBadges.map((badge) => (
          <Card
            key={badge.name}
            className={`border ${badge.bg} text-center shadow-2xs transition-all hover:scale-[1.03] hover:shadow-xs`}
          >
            <CardContent className="flex flex-col items-center p-4">
              <div className="relative size-16 sm:size-20 drop-shadow-xs">
                <Image
                  src={badge.icon}
                  alt={badge.name}
                  width={80}
                  height={80}
                  className="size-full object-contain"
                />
              </div>
              <h3 className="mt-2 text-sm font-bold text-zinc-900">
                {badge.name}
              </h3>
              <p className="text-[11px] font-medium text-[#728A46]">
                {badge.role}
              </p>
              <p className="mt-1.5 hidden text-[11px] text-zinc-500 sm:block leading-tight line-clamp-2">
                {badge.desc}
              </p>
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
