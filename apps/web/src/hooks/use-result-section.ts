"use client"

import { readPlayPreferences } from "@/lib/play-preferences";
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  buildRecommendationApiUrl,
  buildSearchQuery as buildSearchQueryUtil,
  mapLocationErrorCode,
  parseRecommendationApiResponse,
  readSwapsUsed,
} from "@/lib/result-search"
import type { Recommendation, RecommendationResponse } from "@/types/recommendation"
import type {
  ApiErrorResponse,
  RecommendationRequest,
  ResultSearchParams,
} from "@/types/result"

/**
 * Custom hook that powers the activity result page, handling recommendation fetching,
 * activity swapping (rerolls), browser URL synchronization, and error handling.
 *
 * How this hook works:
 * 1. URL State Parsing & Validation:
 *    Extracts search criteria from the URL query parameters (location, age bounds, duration,
 *    replay mission ID, and swap counts). If in `"nearby"` mode without a location,
 *    it redirects immediately to the home search page.
 *
 * 2. Recommendation Fetching (`requestRecommendation`):
 *    - Calls the `/api/recommendations` endpoint with active search criteria.
 *    - AbortController integration cancels in-flight requests when the component unmounts or parameters change.
 *    - Automatically redirects back to the search page with error flags if the location is invalid or ambiguous.
 *
 * 3. Initial Load & Shareable URL Generation:
 *    Loads the initial recommendation and updates the browser URL via `history.replaceState`
 *    with `missionId` and `swapsUsed=0` so the result can be bookmarked or shared directly.
 *
 * 4. Activity Swapping (`handleTryAnother`):
 *    - Allows users to swap activities with no limit.
 *    - Sends all previously viewed `shownMissionIds` as exclusions to prevent immediate repeats.
 *    - Guard checks prevent race conditions if multiple swaps are triggered concurrently.
 *    - Pushes a new entry to browser history (`history.pushState`) with updated mission IDs.
 *
 * 5. Recovery & Navigation:
 *    - `handleTryAgain`: Re-attempts loading if a transient network failure occurred.
 *    - `handleAdjustFilters`: Returns the user to the search page with their existing filter inputs intact.
 *    - `handleBackToSearch`: Returns to a fresh search page.
 *
 * @returns An object containing the current `recommendation`, loading and error states,
 *          swaps remaining, and navigation / action handlers.
 */
export function useResultSection() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { playStyle, canSupervise } = readPlayPreferences(searchParams);
  const locationMode =
    searchParams.get("locationMode") === "home" ? "home" : "nearby"
  const location = searchParams.get("location") || ""
  const lat = searchParams.get("lat") || undefined
  const lng = searchParams.get("lng") || undefined
  const ageMin = searchParams.get("ageMin") || "6"
  const ageMax = searchParams.get("ageMax") || "10"
  const hours = searchParams.get("hours") || "2"
  const minutes = searchParams.get("minutes") || "0"
  const selectedMissionId = searchParams.get("missionId") || undefined
  const swapsUsed = readSwapsUsed(searchParams.get("swapsUsed"))

  const shownMissionIds = useMemo(() => {
    return [
      ...new Set(
        [
          ...searchParams.getAll("shownMissionId"),
          ...(selectedMissionId ? [selectedMissionId] : []),
        ].filter(Boolean)
      ),
    ]
  }, [searchParams, selectedMissionId])

  const parsedSearchParams: ResultSearchParams = useMemo(
    () => ({
      ageMax,
      ageMin,
      hours,
      location,
      lat,
      lng,
      locationMode,
      minutes,
      playStyle,
      canSupervise,
      selectedMissionId,
      shownMissionIds,
      swapsUsed,
    }),
    [
      ageMax,
      ageMin,
      hours,
      location,
      lat,
      lng,
      locationMode,
      minutes,
      playStyle,
      canSupervise,
      selectedMissionId,
      shownMissionIds,
      swapsUsed,
    ]
  )

  const currentMissionId = useRef<string | null>(null)
  const [recommendation, setRecommendation] = useState<
    Recommendation | null | undefined
  >()
  const [error, setError] = useState("")
  const [isRetrying, setIsRetrying] = useState(false)

  const buildSearchQuery = useCallback(() => {
    return buildSearchQueryUtil({
      ageMax,
      ageMin,
      hours,
      location,
      lat,
      lng,
      locationMode,
      minutes,
      playStyle,
      canSupervise,
    })
  }, [
    ageMax,
    ageMin,
    hours,
    location,
    lat,
    lng,
    locationMode,
    minutes,
    playStyle,
    canSupervise,
  ])

  const returnToSearchWithError = useCallback(
    (code: string) => {
      const params = buildSearchQuery()
      const safeCode = mapLocationErrorCode(code)
      params.set("locationError", safeCode)
      router.replace(`/?${params.toString()}`)
    },
    [buildSearchQuery, router]
  )

  const requestRecommendation = useCallback(
    async (request: RecommendationRequest = {}) => {
      const url = buildRecommendationApiUrl(
        {
          ageMax,
          ageMin,
          hours,
          location,
          lat,
          lng,
          locationMode,
          minutes,
          playStyle,
          canSupervise,
        },
        request
      )

      const response = await fetch(url, {
        cache: "no-store",
        signal: request.signal,
      })

      const body = (await response.json()) as
        | RecommendationResponse
        | ApiErrorResponse

      const parsedResult = parseRecommendationApiResponse(
        response.status,
        body
      )

      if (parsedResult.type === "location_error") {
        returnToSearchWithError(parsedResult.errorCode)
        return undefined
      }

      if (parsedResult.type === "error") {
        throw new Error(parsedResult.message)
      }

      return parsedResult.recommendation
    },
    [
      ageMax,
      ageMin,
      hours,
      location,
      lat,
      lng,
      locationMode,
      minutes,
      playStyle,
      canSupervise,
      returnToSearchWithError,
    ]
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
            params.append("shownMissionId", result.missionId)
            window.history.replaceState(
              null,
              "",
              `/result?${params.toString()}`
            )
          }
        }
      } catch (requestError) {
        if (
          requestError instanceof Error &&
          requestError.name === "AbortError"
        ) {
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

  const handleTryAgain = useCallback(async () => {
    try {
      const result = await requestRecommendation({
        missionId: selectedMissionId,
      })

      if (result !== undefined) {
        setError("")
        setRecommendation(result)
        currentMissionId.current = result?.missionId ?? null

        if (result && !selectedMissionId) {
          const params = buildSearchQuery()
          params.set("missionId", result.missionId)
          params.append("shownMissionId", result.missionId)
          window.history.replaceState(null, "", `/result?${params.toString()}`)
        }
      }
    } catch {
      setError("We couldn't load a mission. Please try again.")
    }
  }, [buildSearchQuery, requestRecommendation, selectedMissionId])

  const handleTryAnother = useCallback(async () => {
    if (isRetrying || !recommendation) return

    const sourceMissionId = recommendation.missionId
    const sourceShownMissionIds = shownMissionIds
    setIsRetrying(true)

    try {
      const result = await requestRecommendation({
        excludeMissionIds: sourceShownMissionIds,
      })

      const currentParams = new URL(window.location.href).searchParams
      if (currentParams.get("missionId") !== sourceMissionId) {
        return
      }

      if (result) {
        setError("")
        setRecommendation(result)
        currentMissionId.current = result.missionId

        const params = buildSearchQuery()
        params.set("missionId", result.missionId)
        const nextShownMissionIds = [
          ...new Set([...sourceShownMissionIds, result.missionId]),
        ]
        nextShownMissionIds.forEach((missionId) =>
          params.append("shownMissionId", missionId)
        )
        window.history.pushState(null, "", `/result?${params.toString()}`)
      } else if (result === null) {
        setError("We couldn't load a mission. Please try again.")
      }
    } catch {
      const currentParams = new URL(window.location.href).searchParams
      if (currentParams.get("missionId") === sourceMissionId) {
        setError("We couldn't load a mission. Please try again.")
      }
    } finally {
      setIsRetrying(false)
    }
  }, [
    buildSearchQuery,
    isRetrying,
    recommendation,
    requestRecommendation,
    shownMissionIds,
  ])

  const handleBackToSearch = useCallback(() => {
    router.push("/")
  }, [router])

  const handleAdjustFilters = useCallback(() => {
    router.push(`/?${buildSearchQuery()}`)
  }, [buildSearchQuery, router])

  return {
    error,
    handleAdjustFilters,
    handleBackToSearch,
    handleTryAgain,
    handleTryAnother,
    isRetrying,
    location,
    locationMode,
    recommendation,
    searchParams: parsedSearchParams,
    swapsRemaining: Infinity,
  }
}
