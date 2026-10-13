import {
  CloudRain,
  ShieldCheck,
  Clock,
  MapPin,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Weather-Smart Recommendations",
    description:
      "Melbourne weather can change in minutes. We verify live forecasts so you get indoor play ideas when it's wet and sun-safe park games when it's bright.",
    icon: CloudRain,
  },
  {
    title: "Aussie Wildlife Badges",
    description:
      "Turn physical movement into an exciting nature quest. Kids earn collectible species badges like the Platypus and Koala as they complete missions.",
    icon: ShieldCheck,
  },
  {
    title: "Fits Any Schedule (15–90+ mins)",
    description:
      "Whether you have 15 minutes before dinnertime or a full Saturday afternoon, filter activities to fit your real daily routine without stress.",
    icon: Clock,
  },
  {
    title: "Localized to Victoria",
    description:
      "Search by Victorian postcode or suburb to discover local green spaces, playgrounds, walking paths, or quick backyard activities at home.",
    icon: MapPin,
  },
  {
    title: "Family Week & Holiday Planner",
    description:
      "Save upcoming missions to your planner, organize weekend outings, and align with Victorian school term dates and public holidays.",
    icon: Calendar,
  },
  {
    title: "Judgment-Free Parent Insights",
    description:
      "Monitor progress toward the Australian 60-minute daily active play recommendation with positive, encouraging weekly milestone charts.",
    icon: BarChart3,
  },
];

/**
 * Feature cards section showcasing key value pillars of PlayGo & Co.
 */
export function FeaturesSection() {
  return (
    <section className="py-8 sm:py-12" aria-labelledby="features-heading">
      <div className="text-center">
        <h2
          id="features-heading"
          className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl"
        >
          Why Parents Love PlayGo & Co
        </h2>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base max-w-lg mx-auto">
          Thoughtfully built to reduce parental stress and inspire healthy, active play.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.title}
              className="border border-[#D9C99E]/50 bg-white/70 shadow-2xs backdrop-blur-xs transition-colors hover:border-[#93AB63]/60 hover:bg-white/90"
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#93AB63]/15 text-[#5B7330]">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-xs text-zinc-600 sm:text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
