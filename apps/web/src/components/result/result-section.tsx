"use client"

import Link from "next/link"
import { ArrowLeft, History } from "lucide-react"
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
  } = useResultSection()

  if (locationMode === "nearby" && !location) {
    return null
  }

  const topNav = (
    <>
      <button
        type="button"
        onClick={handleBackToSearch}
        aria-label="Back to search"
        title="Back to search"
        className="absolute top-4 left-4 z-20 flex size-11 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-black/5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] sm:top-6 sm:left-6"
      >
        <ArrowLeft className="size-6" />
      </button>

      <Link
        href="/history"
        aria-label="Completed missions history"
        title="History"
        className="absolute top-4 right-4 z-20 flex size-11 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-black/5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] sm:top-6 sm:right-6"
      >
        <History className="size-6" />
      </Link>
    </>
  )

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
    )
  }

  if (recommendation === undefined) {
    return (
      <>
        {topNav}
        <ResultLoadingState />
      </>
    )
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
    )
  }

  return (
    <>
      {topNav}
      <ActivityResult
        isRetrying={isRetrying}
        onBackToSearch={handleBackToSearch}
        onTryAnother={handleTryAnother}
        recommendation={recommendation}
      />
    </>
  )
}
