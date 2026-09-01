"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  MAX_SWAPS,
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

export function useResultSection() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const locationMode =
    searchParams.get("locationMode") === "home" ? "home" : "nearby"
  const location = searchParams.get("location") || ""
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
      locationMode,
      minutes,
      selectedMissionId,
      shownMissionIds,
      swapsUsed,
    }),
    [
      ageMax,
      ageMin,
      hours,
      location,
      locationMode,
      minutes,
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
      locationMode,
      minutes,
    })
  }, [ageMax, ageMin, hours, location, locationMode, minutes])

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
          locationMode,
          minutes,
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
      locationMode,
      minutes,
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
            params.set("swapsUsed", "0")
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
          params.set("swapsUsed", "0")
          window.history.replaceState(null, "", `/result?${params.toString()}`)
        }
      }
    } catch {
      setError("We couldn't load a mission. Please try again.")
    }
  }, [buildSearchQuery, requestRecommendation, selectedMissionId])

  const handleTryAnother = useCallback(async () => {
    if (swapsUsed >= MAX_SWAPS || !recommendation) return

    const sourceMissionId = recommendation.missionId
    const sourceSwapsUsed = swapsUsed
    const sourceShownMissionIds = shownMissionIds
    setIsRetrying(true)

    try {
      const result = await requestRecommendation({
        excludeMissionIds: sourceShownMissionIds,
      })

      const currentParams = new URL(window.location.href).searchParams
      if (
        currentParams.get("missionId") !== sourceMissionId ||
        readSwapsUsed(currentParams.get("swapsUsed")) !== sourceSwapsUsed
      ) {
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
        params.set("swapsUsed", String(sourceSwapsUsed + 1))
        window.history.pushState(null, "", `/result?${params.toString()}`)
      } else if (result === null) {
        setError("We couldn't load a mission. Please try again.")
      }
    } catch {
      const currentParams = new URL(window.location.href).searchParams
      if (
        currentParams.get("missionId") === sourceMissionId &&
        readSwapsUsed(currentParams.get("swapsUsed")) === sourceSwapsUsed
      ) {
        setError("We couldn't load a mission. Please try again.")
      }
    } finally {
      setIsRetrying(false)
    }
  }, [
    buildSearchQuery,
    recommendation,
    requestRecommendation,
    shownMissionIds,
    swapsUsed,
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
    swapsRemaining: MAX_SWAPS - swapsUsed,
  }
}
