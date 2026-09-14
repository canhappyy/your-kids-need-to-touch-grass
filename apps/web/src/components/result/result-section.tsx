"use client";

import { TopNav } from "@/components/layout/top-nav";
import { ActivityResult } from "./activity-result";
import { EmptyActivityResult } from "./empty-activity-result";
import { ResultErrorState } from "./result-error-state";
import { ResultLoadingState } from "./result-loading-state";
import { useResultSection } from "@/hooks/use-result-section";

/**
 * Top-level container component for the activity result page.
 *
 * Coordinates loading, error, empty, and populated activity result views,
 * along with activity swap logic and navigation.
 */
export function ResultSection() {
  const {
    error,
    chainState,
    handleAddActivity,
    handleAdjustFilters,
    handleBackToSearch,
    handleTryAgain,
    handleTryAnother,
    isRetrying,
    isBusy,
    location,
    locationMode,
    recommendation,
  } = useResultSection();

  if (locationMode === "nearby" && !location) {
    return null;
  }

  const topNav = <TopNav onBack={handleBackToSearch} showHistory />;

  if (error) {
    return (
      <>
        {topNav}
        <ResultErrorState
          error={error}
          onBackToSearch={handleBackToSearch}
          onTryAgain={handleTryAgain}
        />
      </>
    );
  }

  if (recommendation === undefined) {
    return (
      <>
        {topNav}
        <ResultLoadingState />
      </>
    );
  }

  if (recommendation === null) {
    return (
      <>
        {topNav}
        <EmptyActivityResult
          description={
            locationMode === "home"
              ? "We couldn't find a no-equipment activity matching that age range and time window. Try adjusting your filters."
              : undefined
          }
          onAdjustFilters={handleAdjustFilters}
          onBackToSearch={handleBackToSearch}
        />
      </>
    );
  }

  return (
    <>
      {topNav}
      <ActivityResult
        chainState={chainState}
        isBusy={isBusy}
        isRetrying={isRetrying}
        onAddActivity={handleAddActivity}
        onBackToSearch={handleBackToSearch}
        onTryAnother={handleTryAnother}
        recommendation={recommendation}
      />
    </>
  );
}
