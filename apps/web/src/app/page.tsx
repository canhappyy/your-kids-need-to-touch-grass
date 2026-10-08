import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeSearchSection } from "@/components/home/home-search-section";

/**
 * Page metadata for the home search view.
 */
export const metadata: Metadata = {
  title: "PlayGo & Co",
  description: "Find something fun for your child, fast.",
};

/**
 * Main landing page component rendering the activity search form.
 *
 * Wraps the interactive `HomeSearchSection` in a React `Suspense` boundary to support
 * streaming query parameters (such as `planDate` or `history=open`) without blocking
 * initial server-side HTML delivery.
 *
 * @returns The rendered home landing page.
 */
export default function Home() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-6 pt-16 pb-24 text-zinc-900 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-md flex-col">
        {/* Suspense boundary required for client-side search parameter consumption */}
        <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
          <HomeSearchSection />
        </Suspense>
      </div>
    </main>
  );
}

