import type { Recommendation } from "./recommendation"

export type RecommendationRequest = {
  excludeMissionIds?: string[]
  missionId?: string
  signal?: AbortSignal
}

export type ResultSearchParams = {
  locationMode: "nearby" | "home"
  location: string
  ageMin: string
  ageMax: string
  hours: string
  minutes: string
  selectedMissionId?: string
  swapsUsed: number
  shownMissionIds: string[]
}

export type ApiErrorResponse = {
  error?: {
    code?: string
    field?: string
  }
}

export type FetchRecommendationResult =
  | {
      type: "success"
      recommendation: Recommendation | null
    }
  | {
      type: "location_error"
      errorCode: string
    }
  | {
      type: "error"
      message: string
    }
