import type { Metadata } from "next";

/**
 * Page metadata for the parent dashboard view.
 */
export const metadata: Metadata = {
  title: "PlayGo - Dashboard",
  description: "View your child's active play insights and achievements.",
};

/**
 * Dashboard page placeholder view.
 */
export default function DashboardPage() {
  return (
    <main className="relative min-h-svh bg-[#FDF6EA] px-6 pt-16 pb-24 text-zinc-900 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-md flex-col items-center justify-center text-center">
        <h1 className="text-xl font-bold tracking-tight text-zinc-800">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Coming soon</p>
      </div>
    </main>
  );
}
