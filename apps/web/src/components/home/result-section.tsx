"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { ActivityResult } from "./activity-result"
import { EmptyActivityResult } from "./empty-activity-result"
import { Button } from "@/components/ui/button"
import type {
  Recommendation,
  RecommendationResponse,
} from "@/types/recommendation"

type ApiErrorResponse = {
  error?: {
    code?: string
    field?: string
  }
}

type RecommendationRequest = {
  excludeMissionId?: string
  missionId?: string
  signal?: AbortSignal
}

export function ResultSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locationMode = searchParams.get("locationMode") === "home" ? "home" : "nearby"
  const location = searchParams.get("location") || ""
  const ageMin = searchParams.get("ageMin") || "6"
  const ageMax = searchParams.get("ageMax") || "10"
  const hours = searchParams.get("hours") || "2"
  const minutes = searchParams.get("minutes") || "0"
  const selectedMissionId = searchParams.get("missionId") || undefined
  const currentMissionId = useRef<string | null>(null)
  const [recommendation, setRecommendation] = useState<
    Recommendation | null | undefined
  >()
  const [error, setError] = useState("")
  const [isRetrying, setIsRetrying] = useState(false)

  const buildSearchQuery = useCallback(() => {
    return new URLSearchParams({
      locationMode,
      ...(locationMode === "nearby" ? { location } : {}),
      ageMin,
      ageMax,
      hours,
      minutes,
    })
  }, [ageMax, ageMin, hours, location, locationMode, minutes])

  const returnToSearchWithError = useCallback(
    (code: string) => {
      const params = buildSearchQuery()
      const safeCode =
        code === "LOCATION_NOT_FOUND"
          ? "not-found"
          : code === "AMBIGUOUS_LOCATION"
            ? "ambiguous"
            : "invalid"
      params.set("locationError", safeCode)
      router.replace(`/?${params.toString()}`)
    },
    [buildSearchQuery, router],
  )

  const requestRecommendation = useCallback(
    async ({
      excludeMissionId,
      missionId,
      signal,
    }: RecommendationRequest = {}) => {
      const durationMinutes = Number(hours) * 60 + Number(minutes)
      const params = new URLSearchParams({
        locationMode,
        ...(locationMode === "nearby" ? { location } : {}),
        ageMin,
        ageMax,
        durationMinutes: String(durationMinutes),
      })

      if (excludeMissionId) {
        params.set("excludeMissionId", excludeMissionId)
      }
      if (missionId) params.set("missionId", missionId)

      const response = await fetch(`/api/recommendations?${params}`, {
        cache: "no-store",
        signal,
      })
      const body = (await response.json()) as
        | RecommendationResponse
        | ApiErrorResponse

      if (!response.ok) {
        const apiError = (body as ApiErrorResponse).error

        if (
          apiError?.field === "location" &&
          [
            "INVALID_INPUT",
            "LOCATION_NOT_FOUND",
            "AMBIGUOUS_LOCATION",
          ].includes(apiError.code || "")
        ) {
          returnToSearchWithError(apiError.code || "INVALID_INPUT")
          return undefined
        }

        throw new Error("Recommendation request failed")
      }

      return (body as RecommendationResponse).recommendation
    },
    [ageMax, ageMin, hours, location, locationMode, minutes, returnToSearchWithError],
  )

  useEffect(() => {
    if (locationMode === "nearby" && !location) {
      router.replace("/")
      return
    }

    if (
      selectedMissionId &&
      currentMissionId.current === selectedMissionId
    ) {
      return
    }

    const controller = new AbortController()

    async function loadInitialRecommendation() {
      try {
        if (selectedMissionId) setRecommendation(undefined)
        const result = await requestRecommendation({
          missionId: selectedMissionId,
          signal: controller.signal,
        })

        if (result !== undefined) {
          setError("")
          setRecommendation(result)
          currentMissionId.current = result?.missionId ?? null

          if (result && !selectedMissionId) {
            const params = buildSearchQuery()
            params.set("missionId", result.missionId)
            window.history.replaceState(
              null,
              "",
              `/result?${params.toString()}`
            )
          }
        }
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === "AbortError") {
          return
        }

        setError("We couldn't load a mission. Please try again.")
      }
    }

    void loadInitialRecommendation()

    return () => controller.abort()
  }, [
    buildSearchQuery,
    location,
    locationMode,
    requestRecommendation,
    router,
    selectedMissionId,
  ])

  if (locationMode === "nearby" && !location) return null

  if (error) {
    return (
      <section className="flex min-h-[calc(100svh-6.5rem)] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Something went wrong</h1>
        <p className="mt-4 text-zinc-500" role="alert">
          {error}
        </p>
        <Button
          className="mt-8 h-14 w-full rounded-full bg-emerald-600 text-base font-bold text-white hover:bg-emerald-700"
          onClick={async () => {
            try {
              const result = await requestRecommendation({
                missionId: selectedMissionId,
              })

              if (result !== undefined) {
                setError("")
                setRecommendation(result)
              }
            } catch {
              setError("We couldn't load a mission. Please try again.")
            }
          }}
          type="button"
        >
          Try Again
        </Button>
        <Button
          className="mt-3 h-14 w-full rounded-full"
          onClick={() => router.push("/")}
          type="button"
          variant="outline"
        >
          Back to Search
        </Button>
      </section>
    )
  }

  if (recommendation === undefined) {
    return (
      <div
        aria-live="polite"
        className="flex min-h-[calc(100svh-6.5rem)] items-center justify-center text-zinc-500"
        role="status"
      >
        Finding a mission…
      </div>
    )
  }

  if (recommendation === null) {
    return (
      <EmptyActivityResult
        onAdjustFilters={() => router.push(`/?${buildSearchQuery()}`)}
        onBackToSearch={() => router.push("/")}
      />
    )
  }

  return (
    <ActivityResult
      isRetrying={isRetrying}
      onBackToSearch={() => router.push("/")}
      onTryAnother={async () => {
        setIsRetrying(true)

        try {
          const result = await requestRecommendation({
            excludeMissionId: recommendation.missionId,
          })

          if (result !== undefined) {
            setError("")
            setRecommendation(result)

            if (
              result &&
              result.missionId !== recommendation.missionId
            ) {
              currentMissionId.current = result.missionId
              const params = buildSearchQuery()
              params.set("missionId", result.missionId)
              window.history.pushState(
                null,
                "",
                `/result?${params.toString()}`
              )
            }
          }
        } catch {
          setError("We couldn't load a mission. Please try again.")
        } finally {
          setIsRetrying(false)
        }
      }}
      recommendation={recommendation}
    />
  )
}
