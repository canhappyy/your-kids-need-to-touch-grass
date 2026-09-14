"use client"

import { readPlayPreferences } from "@/lib/play-preferences";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  buildRecommendationApiUrl,
  buildChainedRecommendationApiUrl,
  buildSearchQuery as buildSearchQueryUtil,
  mapLocationErrorCode,
  parseRecommendationApiResponse,
  readSwapsUsed,
} from "@/lib/result-search"
import { chainReducer, initialChainState } from "@/lib/chained-mission"
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
  const selectedSecondaryMissionId =
    searchParams.get("secondaryMissionId") || undefined
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
      selectedSecondaryMissionId,
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
      selectedSecondaryMissionId,
      shownMissionIds,
      swapsUsed,
    ]
  )

  const currentMissionId = useRef<string | null>(null)
  const currentSecondaryMissionId = useRef<string | null>(null)
  const chainRequestInFlight = useRef(false)
  const [recommendation, setRecommendation] = useState<
    Recommendation | null | undefined
  >()
  const [error, setError] = useState("")
  const [isRetrying, setIsRetrying] = useState(false)
  const [chainState, dispatchChain] = useReducer(
    chainReducer,
    initialChainState,
  )

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

  const requestChainedRecommendation = useCallback(
    async (
      primary: Recommendation,
      missionId?: string,
      signal?: AbortSignal,
    ) => {
      if (!primary.venue) return null

      const url = buildChainedRecommendationApiUrl(
        {
          ageMax,
          ageMin,
          location,
          lat,
          lng,
          playStyle,
          canSupervise,
        },
        {
          primaryMissionId: primary.missionId,
          openSpaceId: primary.venue.openSpaceId,
          missionId,
          signal,
        },
      )
      const response = await fetch(url, { cache: "no-store", signal })
      const body = (await response.json()) as
        | RecommendationResponse
        | ApiErrorResponse

      if (!response.ok) throw new Error("Chained recommendation failed")
      return (body as RecommendationResponse).recommendation
    },
    [ageMax, ageMin, canSupervise, lat, lng, location, playStyle],
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

  useEffect(() => {
    if (!selectedSecondaryMissionId) {
      currentSecondaryMissionId.current = null
      chainRequestInFlight.current = false
      dispatchChain({ type: "reset" })
      return
    }
    if (
      !recommendation?.venue ||
      recommendation.durationMinutes >= 60 ||
      currentSecondaryMissionId.current === selectedSecondaryMissionId
    ) {
      return
    }

    const controller = new AbortController()
    chainRequestInFlight.current = true
    dispatchChain({ type: "start" })

    void requestChainedRecommendation(
      recommendation,
      selectedSecondaryMissionId,
      controller.signal,
    )
      .then((result) => {
        currentSecondaryMissionId.current = selectedSecondaryMissionId
        dispatchChain(
          result
            ? { type: "success", recommendation: result }
            : { type: "unavailable" },
        )
      })
      .catch((requestError) => {
        if (requestError instanceof Error && requestError.name === "AbortError") {
          return
        }
        dispatchChain({ type: "failure" })
      })
      .finally(() => {
        chainRequestInFlight.current = false
      })

    return () => controller.abort()
  }, [
    recommendation,
    requestChainedRecommendation,
    selectedSecondaryMissionId,
  ])

  const handleAddActivity = useCallback(async () => {
    if (
      chainRequestInFlight.current ||
      isRetrying ||
      !recommendation?.venue ||
      recommendation.durationMinutes >= 60
    ) {
      return
    }

    const sourceMissionId = recommendation.missionId
    chainRequestInFlight.current = true
    dispatchChain({ type: "start" })

    try {
      const result = await requestChainedRecommendation(recommendation)
      const currentParams = new URL(window.location.href).searchParams
      if (currentParams.get("missionId") !== sourceMissionId) return

      if (!result) {
        dispatchChain({ type: "unavailable" })
        return
      }

      currentSecondaryMissionId.current = result.missionId
      dispatchChain({ type: "success", recommendation: result })
      currentParams.set("secondaryMissionId", result.missionId)
      window.history.pushState(
        null,
        "",
        `/result?${currentParams.toString()}`,
      )
    } catch {
      dispatchChain({ type: "failure" })
    } finally {
      chainRequestInFlight.current = false
    }
  }, [isRetrying, recommendation, requestChainedRecommendation])

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
    if (isRetrying || chainRequestInFlight.current || !recommendation) return

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
        currentSecondaryMissionId.current = null
        dispatchChain({ type: "reset" })

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
    chainState,
    handleAddActivity,
    handleAdjustFilters,
    handleBackToSearch,
    handleTryAgain,
    handleTryAnother,
    isRetrying,
    isBusy: isRetrying || chainState.status === "loading",
    location,
    locationMode,
    recommendation,
    searchParams: parsedSearchParams,
    swapsRemaining: Infinity,
  }
}
