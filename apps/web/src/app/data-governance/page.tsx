import type { Metadata } from "next";

import { TopNav } from "@/components/layout/top-nav";

export const metadata: Metadata = {
  title: "PlayGo - Data governance",
};

export default function DataGovernancePage() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-6 pt-16 pb-10 text-zinc-900 sm:px-8">
      <TopNav backHref="/" backAriaLabel="Back to search" />
    </main>
  );
}
