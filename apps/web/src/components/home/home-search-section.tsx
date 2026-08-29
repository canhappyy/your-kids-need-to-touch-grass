"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { HomeSearchForm, type HomeSearchValues } from "./home-search-form"

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
    location: searchParams.get("location") || "",
    ageRange: [
      getNumberParam("ageMin", 6),
      getNumberParam("ageMax", 10),
    ],
    hours: getNumberParam("hours", 2),
    minutes: getNumberParam("minutes", 0),
  }

  const handleSubmit = (values: HomeSearchValues) => {
    const params = new URLSearchParams()
    params.set("location", values.location)
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
        initialValues={initialValues}
        onValidSubmit={handleSubmit}
      />
    </>
  )
}
