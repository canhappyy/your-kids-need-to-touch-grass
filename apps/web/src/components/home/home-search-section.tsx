"use client"

import { useSearchParams, useRouter } from "next/navigation"
import {
  HomeSearchForm,
  type HomeSearchValues,
  type LocationMode,
} from "./home-search-form"

export function HomeSearchSection() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const getNumberParam = (key: string, fallback: number): number => {
    const val = searchParams.get(key)
    if (!val) return fallback
    const parsed = parseInt(val, 10)
    return Number.isNaN(parsed) ? fallback : parsed
  }

  const initialValues: HomeSearchValues = {
    locationMode:
      searchParams.get("locationMode") === "home"
        ? "home"
        : ("nearby" as LocationMode),
    location: searchParams.get("location") || "",
    ageRange: [
      getNumberParam("ageMin", 6),
      getNumberParam("ageMax", 10),
    ],
    hours: getNumberParam("hours", 2),
    minutes: getNumberParam("minutes", 0),
  }

  const locationErrorMessages: Record<string, string> = {
    "not-found": "We couldn't find that postcode. Check it and try again.",
    ambiguous: "Enter a postcode to choose the correct suburb.",
    invalid: "Enter a valid four-digit postcode.",
  }
  const locationErrorCode = searchParams.get("locationError") || ""

  const handleSubmit = (values: HomeSearchValues) => {
    const params = new URLSearchParams()
    params.set("locationMode", values.locationMode)
    if (values.locationMode === "nearby") {
      params.set("location", values.location)
    }
    params.set("ageMin", values.ageRange[0].toString())
    params.set("ageMax", values.ageRange[1].toString())
    params.set("hours", values.hours.toString())
    params.set("minutes", values.minutes.toString())
    router.push(`/result?${params.toString()}`)
  }

  return (
    <>
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Boredom Buster
        </h1>
        <p className="mt-1 text-base text-zinc-500">
          Find something fun for your child, fast.
        </p>
      </header>

      <HomeSearchForm
        initialLocationError={locationErrorMessages[locationErrorCode]}
        initialValues={initialValues}
        onValidSubmit={handleSubmit}
      />
    </>
  )
}
