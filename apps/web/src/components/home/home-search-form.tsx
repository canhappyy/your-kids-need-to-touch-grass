"use client"

import { LocateFixed } from "lucide-react"
import { FormEvent, useRef, useState } from "react"

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

type LocationMode = "nearby" | "home"

type HomeSearchValues = {
  locationMode: LocationMode
  location: string
  ageRange: AgeRange
  hours: number
  minutes: number
}

const defaultHomeSearchValues: HomeSearchValues = {
  locationMode: "nearby",
  location: "",
  ageRange: [6, 10],
  hours: 2,
  minutes: 0,
}

type HomeSearchFormProps = {
  initialValues?: HomeSearchValues
  initialLocationError?: string
  onValidSubmit: (values: HomeSearchValues) => void
}

type NearestPostcodeResponse = {
  postcode?: string
}

function HomeSearchForm({
  initialValues = defaultHomeSearchValues,
  initialLocationError = "",
  onValidSubmit,
}: HomeSearchFormProps) {
  const [locationMode, setLocationMode] = useState<LocationMode>(
    initialValues.locationMode
  )
  const [location, setLocation] = useState(initialValues.location)
  const [ageRange, setAgeRange] = useState<AgeRange>([
    ...initialValues.ageRange,
  ])
  const [hours, setHours] = useState(initialValues.hours)
  const [minutes, setMinutes] = useState(initialValues.minutes)
  const [locationError, setLocationError] = useState(initialLocationError)
  const [timeError, setTimeError] = useState("")
  const [isLocating, setIsLocating] = useState(false)
  const [gpsStatus, setGpsStatus] = useState("")
  const locationInputRef = useRef<HTMLInputElement>(null)

  function showGpsFallback() {
    setIsLocating(false)
    setGpsStatus("")
    setLocationError("We couldn't use your location. Enter your postcode.")
    locationInputRef.current?.focus()
  }

  async function resolveGpsPostcode(coords: GeolocationCoordinates) {
    try {
      const response = await fetch("/api/postcodes/nearest", {
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const body = (await response.json()) as NearestPostcodeResponse

      if (!response.ok || !body.postcode) {
        showGpsFallback()
        return
      }

      setLocation(body.postcode)
      setLocationError("")
      setGpsStatus(`Using postcode ${body.postcode}.`)
      setIsLocating(false)
    } catch {
      showGpsFallback()
    }
  }

  function handleUseMyLocation() {
    setLocationError("")
    setGpsStatus("")

    if (!navigator.geolocation) {
      showGpsFallback()
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void resolveGpsPostcode(coords)
      },
      showGpsFallback,
      {
        enableHighAccuracy: false,
        maximumAge: 300_000,
        timeout: 10_000,
      }
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedLocation = location.trim()
    let nextLocationError = ""

    if (locationMode === "nearby" && !trimmedLocation) {
      nextLocationError = "Enter your postcode."
    } else if (locationMode === "nearby" && !/^\d{4}$/.test(trimmedLocation)) {
      nextLocationError = "Enter a 4-digit postcode."
    }

    const nextTimeError =
      hours === 0 && minutes === 0 ? "Choose at least 5 minutes." : ""

    setLocationError(nextLocationError)
    setTimeError(nextTimeError)

    if (nextLocationError || nextTimeError) return

    onValidSubmit({
      locationMode,
      location: locationMode === "nearby" ? trimmedLocation : "",
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
      <fieldset>
        <legend className="mb-2 text-xs font-medium tracking-wide text-zinc-600 uppercase">
          Activity location
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {([
            ["nearby", "Near me"],
            ["home", "At home"],
          ] as const).map(([value, label]) => (
            <label className="cursor-pointer" key={value}>
              <input
                checked={locationMode === value}
                className="peer sr-only"
                name="locationMode"
                onChange={() => {
                  setLocationMode(value)
                  setLocationError("")
                }}
                type="radio"
                value={value}
              />
              <span className="flex h-[52px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-700 shadow-xs transition-colors peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-800 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600/30 peer-focus-visible:ring-offset-2 hover:bg-zinc-100">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {locationMode === "nearby" && (
        <div className="mt-5">
          <Button
            aria-describedby={gpsStatus ? "location-status" : undefined}
            className="h-[52px] w-full rounded-xl border-zinc-300 bg-white text-base font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:border-emerald-700 focus-visible:ring-emerald-600/20"
            disabled={isLocating}
            onClick={handleUseMyLocation}
            type="button"
            variant="outline"
          >
            <LocateFixed aria-hidden="true" />
            {isLocating ? "Finding your location…" : "Use my location"}
          </Button>

          <div className="mt-4">
            <Label
              className="mb-2 text-xs font-medium tracking-wide text-zinc-600 uppercase"
              htmlFor="location"
            >
              Postcode
            </Label>
            <Input
              aria-describedby={
                locationError
                  ? "location-error"
                  : gpsStatus
                    ? "location-status"
                    : undefined
              }
              aria-invalid={Boolean(locationError)}
              autoComplete="postal-code"
              className="h-[52px] rounded-xl border-zinc-200 bg-zinc-50 px-4 text-base shadow-xs placeholder:text-zinc-500 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20 md:text-base"
              id="location"
              inputMode="numeric"
              maxLength={4}
              name="location"
              onChange={(event) => {
                setLocation(event.target.value)
                setGpsStatus("")
                if (locationError) setLocationError("")
              }}
              pattern="[0-9]{4}"
              placeholder="Postcode, e.g. 3168"
              ref={locationInputRef}
              required
              type="text"
              value={location}
            />
          </div>
          {locationError && (
            <p
              className="mt-2 text-sm text-destructive"
              id="location-error"
              role="alert"
            >
              {locationError}
            </p>
          )}
          {gpsStatus && !locationError && (
            <p
              aria-live="polite"
              className="mt-2 text-sm text-emerald-700"
              id="location-status"
              role="status"
            >
              {gpsStatus}
            </p>
          )}
        </div>
      )}

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
            {ageRange[0]} - {ageRange[1]} years
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
          Hours: 0-12 (1hr steps)
          <span aria-hidden="true" className="px-2">
            ·
          </span>
          Minutes: 0-55 (5min steps)
        </p>
        {timeError && (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {timeError}
          </p>
        )}
      </fieldset>

      <div className="mt-auto pt-16 text-center">
        <Button
          className="h-12 w-full rounded-full bg-emerald-600 px-6 text-base font-bold text-white shadow-[0_10px_24px_rgba(5,150,90,0.25)] hover:bg-emerald-700 focus-visible:border-emerald-700 focus-visible:ring-emerald-600/30"
          size="lg"
          type="submit"
        >
          My Kid Needs to Touch Grass
        </Button>
        <p className="mt-7 text-sm text-zinc-500">
          Tap for a random activity idea {locationMode === "home" ? "at home" : "near you"}
        </p>
      </div>
    </form>
  )
}

export {
  defaultHomeSearchValues,
  HomeSearchForm,
  type LocationMode,
  type HomeSearchValues,
}
