import Image from "next/image";
import Link from "next/link";
import { Compass, CalendarDays, Sparkles, CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Hero banner for the PlayGo & Co landing page.
 *
 * Clearly communicates the app's mission: helping Victorian parents turn screen time
 * into green time with instant, weather-checked active play missions.
 */
export function LandingHero() {
  return (
    <section className="relative flex flex-col items-center text-center pt-2 sm:pt-6 pb-8">
      {/* Brand Tag Pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-[#93AB63]/30 bg-[#93AB63]/10 px-3.5 py-1 text-xs font-semibold text-[#5B7330] sm:text-sm shadow-2xs">
        <Sparkles className="size-3.5 text-[#728A46]" aria-hidden="true" />
        <span>Made for Victorian Families</span>
      </div>

      {/* Brand Logo */}
      <div className="mt-5 flex justify-center">
        <Image
          src="/playgo&co.svg"
          alt="PlayGo & Co"
          width={280}
          height={55}
          priority
          className="h-14 w-auto max-w-full object-contain sm:h-18"
        />
      </div>

      {/* Main Headline */}
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl max-w-2xl leading-[1.18]">
        Turn <span className="text-[#5B7330]">screen time</span> into <span className="text-[#728A46]">green time</span>.
      </h1>

      {/* Value proposition subheadline */}
      <p className="mt-4 max-w-xl text-base text-zinc-600 sm:text-lg leading-relaxed">
        Quick, weather-checked active play missions tailored to your child&apos;s age,
        interests, and free time across Victoria.
      </p>

      {/* Primary CTAs */}
      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/search"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 flex-1 rounded-full bg-[#728A46] text-base font-semibold text-white shadow-sm hover:bg-[#5E7339] active:scale-[0.98] transition-all gap-2",
          )}
        >
          <Compass className="size-5" />
          <span>Find an Activity</span>
        </Link>
        <Link
          href="/planner"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12 flex-1 rounded-full border-[#728A46]/30 bg-white/80 text-base font-semibold text-zinc-800 shadow-2xs hover:bg-white hover:text-zinc-900 active:scale-[0.98] transition-all gap-2",
          )}
        >
          <CalendarDays className="size-5 text-[#728A46]" />
          <span>Open Planner</span>
        </Link>
      </div>

      {/* Trust & Guideline Badges */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs sm:text-sm font-medium text-zinc-600">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-4 text-[#728A46]" aria-hidden="true" />
          <span>60-Min Daily Movement Goal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-4 text-[#728A46]" aria-hidden="true" />
          <span>Live VIC Weather Aware</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-4 text-[#728A46]" aria-hidden="true" />
          <span>Unlock Aussie Wildlife Badges</span>
        </div>
      </div>
    </section>
  );
}
