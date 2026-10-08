import type { Metadata } from "next";
import { TopNav } from "@/components/layout/top-nav";
import { PlannerSection } from "@/components/planner";

/**
 * Page metadata for the activity planner view.
 */
export const metadata: Metadata = {
  title: "PlayGo & Co - Planner",
  description: "Plan your child's activities.",
};

/**
 * Activity Planner page component.
 *
 * Provides a dedicated space for parents to organize family outdoor and indoor play schedules:
 * - Switches dynamically between Month and Week views.
 * - Integrates Victorian school term calendars and public holiday milestones.
 * - Provides navigation back to search or opening the completion history drawer.
 *
 * @returns The rendered activity planner page.
 */
export default function PlannerPage() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-4 pt-16 pb-24 text-zinc-900 sm:px-8 sm:pt-20">
      <TopNav showHistory />
      <PlannerSection />
    </main>
  );
}

