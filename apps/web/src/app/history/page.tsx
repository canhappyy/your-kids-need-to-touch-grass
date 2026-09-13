import type { Metadata } from "next";
import { HistorySection } from "@/components/history/history-section";

export const metadata: Metadata = { title: "PlayGo - Completed missions" };

export default function HistoryPage() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-6 pt-16 pb-10 text-zinc-900 sm:px-8">
      <HistorySection />
    </main>
  );
}
