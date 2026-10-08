import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultSection } from "@/components/result";

/**
 * Page metadata for the activity recommendation result view.
 */
export const metadata: Metadata = {
  title: "PlayGo & Co - Activity Result",
  description: "Find something fun for your child, fast.",
};

/**
 * Activity recommendation result page component.
 *
 * Renders the primary recommended mission, live venue weather conditions,
 * commute travel estimates, safety notices, and mission action options (Save to Backlog or Planner).
 * Wrapped in a `Suspense` boundary to handle search parameter decoding cleanly.
 *
 * @returns The rendered activity recommendation result page.
 */
export default function ResultPage() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-6 pt-16 pb-24 text-zinc-900 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-md flex-col">
        {/* Suspense boundary required for client-side search parameter parsing */}
        <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
          <ResultSection />
        </Suspense>
      </div>
    </main>
  );
}

