"use client";

import { useRef, useState } from "react";
import { TopNav } from "@/components/layout/top-nav";
import { useCompletedMissions } from "@/hooks/use-completed-missions";
import { ClearHistoryDialog } from "./clear-history-dialog";
import { HistoryEmptyState } from "./history-empty-state";
import { HistoryErrorAlert } from "./history-error-alert";
import { HistoryHeader } from "./history-header";
import { HistoryList } from "./history-list";
import { HistoryLoadingState } from "./history-loading-state";

export function HistorySection() {
  const { records, loading, error, refresh, clear } = useCompletedMissions();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const handleClear = () => {
    if (clear()) {
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <TopNav backHref="/" backAriaLabel="Back to search" />
      <div className="mx-auto w-full max-w-lg space-y-6">
        <HistoryHeader headingRef={headingRef} />
        {loading && <HistoryLoadingState />}
        {error && <HistoryErrorAlert message={error} onRetry={refresh} />}
        {!loading && !error && records.length === 0 && <HistoryEmptyState />}
        {!loading && records.length > 0 && <HistoryList records={records} />}
        {!loading && (
          <ClearHistoryDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            onConfirmClear={handleClear}
            showTrigger={records.length > 0 || Boolean(error)}
            error={error}
            finalFocusRef={headingRef}
          />
        )}
      </div>
    </>
  );
}
