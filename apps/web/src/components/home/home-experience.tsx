"use client"

import { useState } from "react"

import {
  ActivityResult,
  mockActivities,
} from "@/components/home/activity-result"
import { EmptyActivityResult } from "@/components/home/empty-activity-result"
import {
  defaultHomeSearchValues,
  HomeSearchForm,
  type HomeSearchValues,
} from "@/components/home/home-search-form"

type HomeScreen =
  | { name: "search" }
  | { activityIndex: number; name: "activity" }
  | { name: "empty" }

function HomeExperience() {
  const [screen, setScreen] = useState<HomeScreen>({ name: "search" })
  const [searchValues, setSearchValues] = useState<HomeSearchValues>(
    defaultHomeSearchValues
  )

  if (screen.name === "activity") {
    return (
      <ActivityResult
        activity={mockActivities[screen.activityIndex]}
        onTryAnother={() =>
          setScreen({
            name: "activity",
            activityIndex:
              (screen.activityIndex + 1) % mockActivities.length,
          })
        }
      />
    )
  }

  if (screen.name === "empty") {
    return (
      <EmptyActivityResult
        onAdjustFilters={() => setScreen({ name: "search" })}
        onBackToSearch={() => {
          setSearchValues(defaultHomeSearchValues)
          setScreen({ name: "search" })
        }}
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

      <HomeSearchForm
        initialValues={searchValues}
        onValidSubmit={(values) => {
          setSearchValues(values)
          setScreen(
            values.location === "9999"
              ? { name: "empty" }
              : { name: "activity", activityIndex: 0 }
          )
        }}
      />
    </>
  )
}

export { HomeExperience }
