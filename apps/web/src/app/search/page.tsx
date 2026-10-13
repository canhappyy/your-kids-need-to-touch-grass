import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeSearchSection } from "@/components/home/home-search-section";
import { LorikeetLoader } from "@/components/ui/lorikeet-loader";

/**
 * Page metadata for the activity search finder view.
 */
export const metadata: Metadata = {
  title: "PlayGo & Co - Find Activity",
  description: "Find something fun for your child, fast.",
};

/**
 * Dedicated activity search page component rendering the filter form.
 *
 * Wraps `HomeSearchSection` in a React `Suspense` boundary to support
 * streaming URL query parameters (`planDate`, `history=open`, location errors)
 * without blocking server rendering.
 *
 * @returns The rendered activity search page.
 */
export default function SearchPage() {
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
    </main>
  );
}
