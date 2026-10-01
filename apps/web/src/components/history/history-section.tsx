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

/**
 * Props for the {@link HistorySection} component.
 */
export type HistorySectionProps = {
  /** Optional callback fired when the user chooses to close or find a mission. */
  onClose?: () => void;
  /** Whether to render top navigation back button inside the section. Defaults to false. */
  showNav?: boolean;
};

/**
 * Main presentation and coordinator component for the mission history view.
 *
 * Integrates client-side storage state via {@link useCompletedMissions},
 * loading/error states, empty fallback, mission record list, and the history-clearing workflow.
 */
export function HistorySection({
  onClose,
  showNav = false,
}: HistorySectionProps = {}) {
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
      {showNav && <TopNav backHref="/" backAriaLabel="Back to search" />}
      <div className="mx-auto w-full max-w-lg space-y-6">
        <HistoryHeader headingRef={headingRef} />
        {loading && <HistoryLoadingState />}
        {error && <HistoryErrorAlert message={error} onRetry={refresh} />}
        {!loading && !error && records.length === 0 && (
          <HistoryEmptyState onClose={onClose} />
        )}
        {!loading && records.length > 0 && <HistoryList records={records} />}
        {!loading && (
          <ClearHistoryDialog
            error={error}
            finalFocusRef={headingRef}
            onConfirmClear={handleClear}
            onOpenChange={setConfirmOpen}
            open={confirmOpen}
            showTrigger={records.length > 0 || Boolean(error)}
          />
        )}
      </div>
    </>
  );
}
