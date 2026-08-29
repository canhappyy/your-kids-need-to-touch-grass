"use client"

import { FormEvent, useState } from "react"

import { AgeRangeSlider, type AgeRange } from "@/components/home/age-range-slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const hourOptions = Array.from({ length: 13 }, (_, hour) => ({
  label: `${hour} hr`,
  value: hour,
}))

const minuteOptions = Array.from({ length: 12 }, (_, index) => {
  const minute = index * 5

  return {
    label: `${minute.toString().padStart(2, "0")} min`,
    value: minute,
  }
})

type HomeSearchValues = {
  location: string
  ageRange: AgeRange
  hours: number
  minutes: number
}

type HomeSearchFormProps = {
  onValidSubmit: (values: HomeSearchValues) => void
}

function HomeSearchForm({ onValidSubmit }: HomeSearchFormProps) {
  const [location, setLocation] = useState("")
  const [ageRange, setAgeRange] = useState<AgeRange>([6, 10])
  const [hours, setHours] = useState(2)
  const [minutes, setMinutes] = useState(0)
  const [locationError, setLocationError] = useState("")
  const [timeError, setTimeError] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedLocation = location.trim()
    const isNumericLocation = /^\d+$/.test(trimmedLocation)
    let nextLocationError = ""

    if (!trimmedLocation) {
      nextLocationError = "Enter a suburb or postcode."
    } else if (isNumericLocation && !/^\d{4}$/.test(trimmedLocation)) {
      nextLocationError = "Enter a 4-digit postcode."
    }

    const nextTimeError =
      hours === 0 && minutes === 0 ? "Choose at least 5 minutes." : ""

    setLocationError(nextLocationError)
    setTimeError(nextTimeError)

    if (nextLocationError || nextTimeError) return

    onValidSubmit({
      location: trimmedLocation,
      ageRange,
      hours,
      minutes,
    })
  }

  return (
    <form
      className="mt-7 flex flex-1 flex-col"
      noValidate
      onSubmit={handleSubmit}
    >
      <div>
        <Label
          className="mb-2 text-xs font-medium tracking-wide text-zinc-600 uppercase"
          htmlFor="location"
        >
          Location
        </Label>
        <Input
          aria-describedby={locationError ? "location-error" : undefined}
          aria-invalid={Boolean(locationError)}
          autoComplete="postal-code"
          className="h-[52px] rounded-xl border-zinc-200 bg-zinc-50 px-4 text-base shadow-xs placeholder:text-zinc-500 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20 md:text-base"
          id="location"
          name="location"
          onChange={(event) => {
            setLocation(event.target.value)
            if (locationError) setLocationError("")
          }}
          placeholder="Suburb or postcode, e.g. Clayton 3168"
          required
          type="text"
          value={location}
        />
        {locationError && (
          <p
            className="mt-2 text-sm text-destructive"
            id="location-error"
            role="alert"
          >
            {locationError}
          </p>
        )}
      </div>

      <fieldset className="mt-8">
        <legend className="sr-only">Child&apos;s age range</legend>
        <div className="mb-4 flex items-center justify-between gap-4">
          <span
            aria-hidden="true"
            className="text-xs font-medium tracking-wide text-zinc-600 uppercase"
          >
            Child&apos;s age range
          </span>
          <output
            aria-live="polite"
            className="text-sm font-semibold tabular-nums text-zinc-900"
          >
            {ageRange[0]} – {ageRange[1]} years
          </output>
        </div>
        <AgeRangeSlider onValueChange={setAgeRange} value={ageRange} />
        <input name="ageMin" type="hidden" value={ageRange[0]} />
        <input name="ageMax" type="hidden" value={ageRange[1]} />
      </fieldset>

      <fieldset className="mt-7">
        <legend className="mb-2 text-xs font-medium tracking-wide text-zinc-600 uppercase">
          Time available
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="sr-only" htmlFor="hours">
              Hours
            </Label>
            <Select
              id="hours"
              items={hourOptions}
              name="hours"
              onValueChange={(value) => {
                if (value !== null) setHours(value)
                if (timeError) setTimeError("")
              }}
              value={hours}
            >
              <SelectTrigger className="h-[52px] w-full rounded-xl border-zinc-200 bg-zinc-50 px-4 text-base font-semibold shadow-xs focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {hourOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="sr-only" htmlFor="minutes">
              Minutes
            </Label>
            <Select
              id="minutes"
              items={minuteOptions}
              name="minutes"
              onValueChange={(value) => {
                if (value !== null) setMinutes(value)
                if (timeError) setTimeError("")
              }}
              value={minutes}
            >
              <SelectTrigger className="h-[52px] w-full rounded-xl border-zinc-200 bg-zinc-50 px-4 text-base font-semibold shadow-xs focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {minuteOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Hours: 0–12 (1hr steps)
          <span aria-hidden="true" className="px-2">
            ·
          </span>
          Minutes: 0–55 (5min steps)
        </p>
        {timeError && (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {timeError}
          </p>
        )}
      </fieldset>

      <div className="mt-auto pt-16 text-center">
        <Button
          className="h-[68px] w-full rounded-full bg-emerald-600 px-6 text-lg font-bold text-white shadow-[0_10px_24px_rgba(5,150,90,0.25)] hover:bg-emerald-700 focus-visible:border-emerald-700 focus-visible:ring-emerald-600/30"
          size="lg"
          type="submit"
        >
          My Kid Needs to Touch Grass
        </Button>
        <p className="mt-7 text-sm text-zinc-500">
          Tap for a random activity idea near you
        </p>
      </div>
    </form>
  )
}

export { HomeSearchForm, type HomeSearchValues }
