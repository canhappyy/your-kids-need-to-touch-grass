import { LorikeetLoader } from "@/components/ui/lorikeet-loader";

/**
 * Accessible loading indicator rendered while mission history is being read from browser storage.
 */
export function HistoryLoadingState() {
  return (
    <div className="flex flex-col items-center gap-2 text-zinc-500" role="status">
      <LorikeetLoader />
      <span>Loading history…</span>
    </div>
  );
}
