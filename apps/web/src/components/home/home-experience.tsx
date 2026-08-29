"use client"

import { useState } from "react"

import {
  ActivityResult,
  mockActivities,
} from "@/components/home/activity-result"
import { HomeSearchForm } from "@/components/home/home-search-form"

function HomeExperience() {
  const [activityIndex, setActivityIndex] = useState<number | null>(null)

  if (activityIndex !== null) {
    return (
      <ActivityResult
        activity={mockActivities[activityIndex]}
        onTryAnother={() =>
          setActivityIndex((currentIndex) =>
            currentIndex === null
              ? 0
              : (currentIndex + 1) % mockActivities.length
          )
        }
      />
    )
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

      <HomeSearchForm onValidSubmit={() => setActivityIndex(0)} />
    </>
  )
}

export { HomeExperience }
