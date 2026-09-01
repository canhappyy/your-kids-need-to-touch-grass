import type {
  FormValidationResult,
  HomeSearchValues,
  NearestPostcodeResponse,
} from "@/types/home-search"

export const hourOptions = Array.from({ length: 13 }, (_, hour) => ({
  label: `${hour} hr`,
  value: hour,
}))

export const minuteOptions = Array.from({ length: 12 }, (_, index) => {
  const minute = index * 5

  return {
    label: `${minute.toString().padStart(2, "0")} min`,
    value: minute,
  }
})

export const defaultHomeSearchValues: HomeSearchValues = {
  ageRange: [6, 10],
  hours: 2,
  location: "",
  locationMode: "nearby",
  minutes: 0,
}

/**
 * Validates the search form fields.
 */
export function validateSearchForm(
  values: Pick<HomeSearchValues, "locationMode" | "location" | "hours" | "minutes">
): FormValidationResult {
  const trimmedLocation = values.location.trim()
  let locationError = ""

  if (values.locationMode === "nearby" && !trimmedLocation) {
    locationError = "Enter your postcode."
  } else if (
    values.locationMode === "nearby" &&
    !/^\d{4}$/.test(trimmedLocation)
  ) {
    locationError = "Enter a 4-digit postcode."
  }

  const timeError =
    values.hours === 0 && values.minutes === 0
      ? "Choose at least 5 minutes."
      : ""

  return {
    isValid: !locationError && !timeError,
    locationError,
    timeError,
  }
}

/**
 * Fetches the nearest postcode for GPS coordinates from the backend API.
 */
export async function fetchNearestPostcode(coords: {
  latitude: number
  longitude: number
}): Promise<string | null> {
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
    return null
  }

  return body.postcode
}
