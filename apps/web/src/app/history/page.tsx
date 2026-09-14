import type { Metadata } from "next";
import { HistorySection } from "@/components/history/history-section";

/**
 * Page metadata for the completed missions history view.
 */
export const metadata: Metadata = { title: "PlayGo - Completed missions" };

/**
 * Completed missions history page component allowing parents to view and clear completed activities.
 */
export default function HistoryPage() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-6 pt-16 pb-10 text-zinc-900 sm:px-8">
      <HistorySection />
    </main>
  );
}
