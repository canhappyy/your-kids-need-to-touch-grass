import Link from "next/link";
import { Compass, CalendarDays } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Bottom Call-To-Action banner for the landing page.
 */
export function LandingCta() {
  return (
    <section className="py-8 sm:py-12" aria-labelledby="cta-heading">
      <div className="rounded-3xl border border-[#728A46] bg-[#728A46] p-8 sm:p-12 text-center text-white shadow-md">
        <div className="mx-auto max-w-xl">
          <h2
            id="cta-heading"
            className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl leading-tight"
          >
            Ready to trade screen time for sunshine?
          </h2>
          <p className="mt-3 text-sm text-white/90 sm:text-base leading-relaxed">
            Enter your suburb and child&apos;s interests to discover great outdoor and indoor play ideas in less than 30 seconds.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/search"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full bg-white text-base font-bold text-[#556933] shadow-sm hover:bg-zinc-100 active:scale-[0.98] transition-all gap-2 px-6",
              )}
            >
              <Compass className="size-5" />
              <span>Find an Activity Now</span>
            </Link>
            <Link
              href="/planner"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-full border-white/40 bg-white/10 text-base font-semibold text-white shadow-2xs hover:bg-white/20 active:scale-[0.98] transition-all gap-2 px-6",
              )}
            >
              <CalendarDays className="size-5" />
              <span>Plan Upcoming Days</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
