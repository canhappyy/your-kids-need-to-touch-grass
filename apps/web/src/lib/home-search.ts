import type {
  AgeBucketId,
  AgeBucketOption,
  AgeRange,
  FormValidationResult,
  HomeSearchValues,
  NearestPostcodeResponse,
} from "@/types/home-search";

export const AGE_BUCKETS: AgeBucketOption[] = [
  { id: "5-6", label: "5 - 6 yrs", max: 6, min: 5 },
  { id: "7-9", label: "7 - 9 yrs", max: 9, min: 7 },
  { id: "10-12", label: "10 - 12 yrs", max: 12, min: 10 },
];

/**
 * Derives the active age bucket IDs from an age range [min, max].
 */
export function getInitialBuckets(range: AgeRange): AgeBucketId[] {
  const [min, max] = range;
  const buckets: AgeBucketId[] = [];
  if (min <= 6 && max >= 5) buckets.push("5-6");
  if (min <= 9 && max >= 7) buckets.push("7-9");
  if (min <= 12 && max >= 10) buckets.push("10-12");
  return buckets.length > 0 ? buckets : ["7-9"];
}

/**
 * Calculates the combined age range [min, max] from one or more selected bucket IDs.
 */
export function calculateRangeFromBuckets(bucketIds: AgeBucketId[]): AgeRange {
  const selected = AGE_BUCKETS.filter((b) => bucketIds.includes(b.id));
  if (selected.length === 0) return [7, 9];
  return [
    Math.min(...selected.map((b) => b.min)),
    Math.max(...selected.map((b) => b.max)),
  ];
}

export const hourOptions = Array.from({ length: 13 }, (_, hour) => ({
  label: `${hour} hr`,
  value: hour,
}));

export const minuteOptions = [15, 30, 45, 60, 75, 90].map((minute) => ({
  label: `${minute} min`,
  value: minute,
}));

export const defaultHomeSearchValues: HomeSearchValues = {
  ageRange: [7, 9],
  hours: 0,
  location: "",
  locationMode: "nearby",
  minutes: 45,
};

/**
 * Validates the search form fields.
 */
export function validateSearchForm(
  values: Pick<HomeSearchValues, "locationMode" | "location" | "minutes"> & {
    hours?: number;
  },
): FormValidationResult {
  const trimmedLocation = values.location.trim();
  let locationError = "";

  if (values.locationMode === "nearby" && !trimmedLocation) {
    locationError = "Enter your postcode.";
  } else if (
    values.locationMode === "nearby" &&
    !/^\d{4}$/.test(trimmedLocation)
  ) {
    locationError = "Enter a 4-digit postcode.";
  }

  const totalMinutes = (values.hours ?? 0) * 60 + values.minutes;
  const timeError = totalMinutes < 15 ? "Choose at least 15 minutes." : "";

  return {
    isValid: !locationError && !timeError,
    locationError,
    timeError,
  };
}

/**
 * Fetches the nearest postcode for GPS coordinates from the backend API.
 */
export async function fetchNearestPostcode(coords: {
  latitude: number;
  longitude: number;
}): Promise<string | null> {
  const response = await fetch("/api/postcodes/nearest", {
    body: JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const body = (await response.json()) as NearestPostcodeResponse;

  if (!response.ok || !body.postcode) {
    return null;
  }

  return body.postcode;
}
