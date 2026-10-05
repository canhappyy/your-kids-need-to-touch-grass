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
 * Parent dashboard page showing locally recorded activity insights.
 */
export default function DashboardPage() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-3 pt-16 pb-24 text-zinc-900 sm:px-8 sm:pt-20">
      <TopNav showHistory />
      <div className="mx-auto w-full max-w-5xl">
        <DashboardSection />
      </div>
    </main>
  );
}
