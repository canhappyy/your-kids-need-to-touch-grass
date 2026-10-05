import type { Metadata } from "next";

import { DataGovernanceSection } from "@/components/data-governance";
import { TopNav } from "@/components/layout/top-nav";

export const metadata: Metadata = {
  title: "PlayGo & Co - Data governance",
  description:
    "Learn about PlayGo & Co data sources, open data licenses, activity library curation, and privacy commitments.",
};

export default function DataGovernancePage() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-4 pt-16 pb-12 text-zinc-900 sm:px-6 md:px-8">
      <TopNav backHref="/" backAriaLabel="Back to search" />
      <DataGovernanceSection />
    </main>
  );
}
