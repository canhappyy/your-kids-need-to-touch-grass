"use client"

import { ActivityResult } from "./activity-result"
import { EmptyActivityResult } from "./empty-activity-result"
import { ResultErrorState } from "./result-error-state"
import { ResultLoadingState } from "./result-loading-state"
import { useResultSection } from "@/hooks/use-result-section"

export function ResultSection() {
  const {
    error,
    handleAdjustFilters,
    handleBackToSearch,
    handleTryAgain,
    handleTryAnother,
    isRetrying,
    location,
    locationMode,
    recommendation,
    swapsRemaining,
  } = useResultSection()

  if (locationMode === "nearby" && !location) {
    return null
  }

  if (error) {
    return (
      <ResultErrorState
        error={error}
        onBackToSearch={handleBackToSearch}
        onTryAgain={handleTryAgain}
      />
    )
  }

  if (recommendation === undefined) {
    return <ResultLoadingState />
  }

  if (recommendation === null) {
    return (
      <EmptyActivityResult
        description={
          locationMode === "home"
            ? "We couldn't find a no-equipment activity matching that age range and time window. Try adjusting your filters."
            : undefined
        }
        onAdjustFilters={handleAdjustFilters}
        onBackToSearch={handleBackToSearch}
      />
    )
  }

  return (
    <ActivityResult
      isRetrying={isRetrying}
      onBackToSearch={handleBackToSearch}
      onTryAnother={handleTryAnother}
      recommendation={recommendation}
      swapsRemaining={swapsRemaining}
    />
  )
}
