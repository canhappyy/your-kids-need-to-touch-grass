import type { Metadata } from "next";
import { TopNav } from "@/components/layout/top-nav";
import { PlannerSection } from "@/components/planner";

/**
 * Page metadata for the planner view.
 */
export const metadata: Metadata = {
  title: "PlayGo & Co - Planner",
  description: "Plan your child's activities.",
};

/**
 * Parent activity planner with local schedules and Victorian important dates.
 */
export default function PlannerPage() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-4 pt-16 pb-24 text-zinc-900 sm:px-8 sm:pt-20">
      <TopNav showHistory />
      <PlannerSection />
    </main>
  );
}
