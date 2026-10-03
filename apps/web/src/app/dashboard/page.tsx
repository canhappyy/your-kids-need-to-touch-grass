import type { Metadata } from "next";
import { DashboardSection } from "@/components/dashboard";

/**
 * Page metadata for the parent dashboard view.
 */
export const metadata: Metadata = {
  title: "playgo & co - Parent Dashboard",
  description: "View your child's active play insights and achievements.",
};

/**
 * Parent dashboard page showing locally recorded activity insights.
 */
export default function DashboardPage() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-5 pt-8 pb-24 text-zinc-900 sm:px-8 sm:pt-12">
      <div className="mx-auto w-full max-w-5xl">
        <DashboardSection />
      </div>
    </main>
  );
}
