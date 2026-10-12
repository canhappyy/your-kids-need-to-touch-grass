import type { Metadata } from "next";
import { Suspense } from "react";
import { LandingSection } from "@/components/landing";

/**
 * Page metadata for the main landing page view.
 */
export const metadata: Metadata = {
  title: "PlayGo & Co - Turn Screen Time into Green Time",
  description:
    "Discover fun, weather-checked active missions and outdoor adventures tailored to your child's age, interests, and free time across Victoria.",
};

/**
 * Main dedicated landing page component.
 *
 * Explains what PlayGo & Co is immediately: helping Victorian families
 * find active, screen-free missions, track movement toward national guidelines,
 * and collect native Australian wildlife badges.
 *
 * @returns The rendered dedicated landing page.
 */
export default function Home() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-4 pt-16 pb-24 text-zinc-900 sm:px-6 md:px-8 sm:pt-20">
      <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
        <LandingSection />
      </Suspense>
    </main>
  );
}

