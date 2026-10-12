import { LorikeetLoader } from "@/components/ui/lorikeet-loader";

/**
 * Accessible loading indicator displayed while fetching activity recommendations.
 */
export function ResultLoadingState() {
  return (
    <div
      aria-live="polite"
      className="flex min-h-[calc(100svh-6.5rem)] items-center justify-center text-zinc-500"
      role="status"
    >
      <div className="flex flex-col items-center gap-2">
        <LorikeetLoader />
        <span>Finding a mission…</span>
      </div>
    </div>
  );
}
