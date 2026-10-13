import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeSearchSection } from "@/components/home/home-search-section";
import { LorikeetLoader } from "@/components/ui/lorikeet-loader";
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
    <main className="relative min-h-svh bg-[#FDF6EA] px-6 pt-16 pb-24 text-zinc-900 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-md flex-col">
        {/* Suspense boundary required for client-side search parameter consumption */}
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <LorikeetLoader />
              <span>Loading...</span>
            </div>
          }
        >
          <HomeSearchSection />
        </Suspense>
      </div>
    <main className="relative min-h-svh bg-[#FDF6EA] px-4 pt-16 pb-24 text-zinc-900 sm:px-6 md:px-8 sm:pt-20">
      <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
        <LandingSection />
      </Suspense>
    </main>
  );
}
