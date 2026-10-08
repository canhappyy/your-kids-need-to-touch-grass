import type { Metadata } from "next";
import { TopNav } from "@/components/layout/top-nav";
import { DashboardSection } from "@/components/dashboard";

/**
 * Page metadata for the parent dashboard view.
 */
export const metadata: Metadata = {
  title: "PlayGo & Co - Parent Dashboard",
  description: "View your child's active play insights and achievements.",
};

/**
 * Parent Dashboard page component.
 *
 * Provides parents with a private, judgment-free window into their child's active play milestones:
 * - Daily goal progress vs. the 60-minute Australian national recommendation.
 * - Weekly activity minutes bar chart with daily breakdown.
 * - Milestone wildlife badges gallery celebrating consistency and variety.
 * - Discovery of child's emerging favorite play categories.
 *
 * @returns The rendered parent dashboard page.
 */
export default function DashboardPage() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-4 pt-16 pb-24 text-zinc-900 sm:px-6 md:px-8 sm:pt-20">
      <TopNav showHistory />
      <div className="mx-auto w-full max-w-5xl">
        <DashboardSection />
      </div>
    </main>
  );
}

