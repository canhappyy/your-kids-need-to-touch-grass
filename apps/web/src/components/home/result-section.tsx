"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ActivityResult, mockActivities } from "./activity-result"
import { EmptyActivityResult } from "./empty-activity-result"

export function ResultSection() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const location = searchParams.get("location")
  const ageMin = searchParams.get("ageMin") || "6"
  const ageMax = searchParams.get("ageMax") || "10"
  const hours = searchParams.get("hours") || "2"
  const minutes = searchParams.get("minutes") || "0"
  const indexVal = searchParams.get("index")
  const index = indexVal ? parseInt(indexVal, 10) : 0

  useEffect(() => {
    if (!location) {
      router.replace("/")
    }
  }, [location, router])

  if (!location) {
    return null
  }

  const buildQueryString = (overrideParams?: Record<string, string>) => {
    const params = new URLSearchParams()
    params.set("location", location)
    params.set("ageMin", ageMin)
    params.set("ageMax", ageMax)
    params.set("hours", hours)
    params.set("minutes", minutes)
    if (overrideParams) {
      Object.entries(overrideParams).forEach(([key, val]) => {
        params.set(key, val)
      })
    }
    return params.toString()
  }

  if (location === "9999") {
    return (
      <EmptyActivityResult
        onAdjustFilters={() => {
          router.push(`/?${buildQueryString()}`)
        }}
        onBackToSearch={() => {
          router.push("/")
        }}
      />
    )
  }

  const activityIndex = Number.isNaN(index) ? 0 : index
  const activity = mockActivities[activityIndex % mockActivities.length]

  return (
    <ActivityResult
      activity={activity}
      onTryAnother={() => {
        const nextIndex = (activityIndex + 1) % mockActivities.length
        router.push(`/result?${buildQueryString({ index: nextIndex.toString() })}`)
      }}
    />
  )
}
