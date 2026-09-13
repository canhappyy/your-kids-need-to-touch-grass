"use client"

import { useRef, useState } from "react"
import { saveCompletedMission } from "@/lib/completed-missions"
import type { Recommendation } from "@/types/recommendation"

/** Mounted per recommendation visit; synchronous guard prevents double taps. */
export function useMissionCompletion(recommendation: Recommendation, isRetrying: boolean) {
  const saved = useRef<Recommendation | null>(null)
  const [savedFor, setSavedFor] = useState<Recommendation | null>(null)
  const [error, setError] = useState("")

  const complete = () => {
    if (saved.current === recommendation || isRetrying) return
    try {
      saveCompletedMission({
        id: crypto.randomUUID(),
        missionId: recommendation.missionId,
        name: recommendation.title,
        completedAt: new Date().toISOString(),
        durationMinutes: recommendation.durationMinutes,
      })
      saved.current = recommendation
      setSavedFor(recommendation)
      setError("")
    } catch {
      setError("Completion could not be saved. Check browser storage or visit History to review existing records.")
    }
  }

  return { complete, completed: savedFor === recommendation, error }
}
