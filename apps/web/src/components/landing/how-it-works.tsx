import { SlidersHorizontal, CloudSun, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: "01",
    title: "Tell us what they love",
    description:
      "Choose your child's age (5–12), Victorian suburb, and play style—from energetic ball sports to quiet nature trails or indoor crafts.",
    icon: SlidersHorizontal,
    badgeColor: "bg-[#93AB63]/20 text-[#5B7330]",
  },
  {
    step: "02",
    title: "Get an instant, weather-ready mission",
    description:
      "Whether it's sunny or drizzling, we check real-time forecast data and find the best match for your available time window (15–90+ mins).",
    icon: CloudSun,
    badgeColor: "bg-amber-100 text-amber-800",
  },
  {
    step: "03",
    title: "Play, achieve & unlock badges",
    description:
      "Kids complete missions and collect Australian wildlife badges (Platypus, Sugar Glider, Koala) while building healthy daily movement habits.",
    icon: Award,
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
];

/**
 * Explanatory section highlighting how PlayGo & Co simplifies finding activities.
 */
export function HowItWorks() {
  return (
    <section className="py-8 sm:py-12" aria-labelledby="how-it-works-heading">
      <div className="text-center">
        <h2
          id="how-it-works-heading"
          className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl"
        >
          How PlayGo & Co Works
        </h2>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base max-w-lg mx-auto">
          No planning fatigue. Three simple steps to happy, active kids.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.step}
              className="relative overflow-hidden border border-[#D9C99E]/50 bg-white/70 shadow-2xs backdrop-blur-xs transition-transform hover:-translate-y-0.5 hover:shadow-xs"
            >
              <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex size-11 items-center justify-center rounded-xl ${item.badgeColor}`}
                  >
                    <Icon className="size-5.5" aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xl font-bold text-zinc-300">
                    {item.step}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-zinc-900 sm:text-lg">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-zinc-600 sm:text-sm leading-relaxed flex-1">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
