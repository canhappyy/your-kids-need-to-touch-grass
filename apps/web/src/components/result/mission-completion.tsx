"use client"

import { Button } from "@/components/ui/button"
import { useMissionCompletion } from "@/hooks/use-mission-completion"
import type { Recommendation } from "@/types/recommendation"

export function MissionCompletion({ recommendation, isRetrying }: {
  recommendation: Recommendation
  isRetrying: boolean
}) {
  const { complete, completed, error } = useMissionCompletion(recommendation, isRetrying)
  return (
    <div className="space-y-2">
      <Button className="h-12 w-full rounded-full" disabled={completed || isRetrying} onClick={complete}>
        {completed ? "Completed" : "Mark completed"}
      </Button>
      {completed && <p role="status" className="text-center text-sm text-zinc-600">Saved to your history.</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  )
}
