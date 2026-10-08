import { playPreferenceParams } from "@/lib/play-preferences";
import type { RecommendationResponse } from "@/types/recommendation";
import type {
  ApiErrorResponse,
  FetchRecommendationResult,
  RecommendationRequest,
  ResultSearchParams,
} from "@/types/result";

/**
 * Validates and normalizes the swaps used count from URL search parameters.
 */
export function readSwapsUsed(value: string | null): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 0
    ? parsed
    : 0;
}

/**
 * Builds standard search query URLSearchParams from form/result search parameters.
 */
export function buildSearchQuery(
  params: Pick<
    ResultSearchParams,
    | "locationMode"
    | "location"
    | "ageMin"
    | "ageMax"
    | "hours"
    | "minutes"
    | "playStyle"
    | "canSupervise"
    | "lat"
    | "lng"
    | "planDate"
    | "interests"
  >,
): URLSearchParams {
  const query = new URLSearchParams({
    ...playPreferenceParams(params),
    locationMode: params.locationMode,
    ...(params.locationMode === "nearby" ? { location: params.location } : {}),
    ageMin: params.ageMin,
    ageMax: params.ageMax,
    hours: params.hours,
    minutes: params.minutes,
  });

  if (params.locationMode === "nearby" && params.lat && params.lng) {
    query.set("lat", params.lat);
    query.set("lng", params.lng);
  }
  if (params.interests) {
    query.set("interests", params.interests);
  }
  if (params.planDate) query.set("planDate", params.planDate);

  return query;
}

/**
 * Normalizes backend location error codes into frontend safe query parameter codes.
 */
export function mapLocationErrorCode(
  code: string,
): "not-found" | "ambiguous" | "invalid" {
  if (code === "LOCATION_NOT_FOUND") return "not-found";
  if (code === "AMBIGUOUS_LOCATION") return "ambiguous";
  return "invalid";
}

/**
 * Builds the URL with query parameters for the /api/recommendations endpoint.
 */
export function buildRecommendationApiUrl(
  searchParams: Pick<
    ResultSearchParams,
    | "locationMode"
    | "location"
    | "ageMin"
    | "ageMax"
    | "hours"
    | "minutes"
    | "playStyle"
    | "canSupervise"
    | "lat"
    | "lng"
    | "interests"
  >,
  request: RecommendationRequest = {},
): string {
  const durationMinutes =
    Number(searchParams.hours) * 60 + Number(searchParams.minutes);

  const params = new URLSearchParams({
    ...playPreferenceParams(searchParams),
    locationMode: searchParams.locationMode,
    ...(searchParams.locationMode === "nearby"
      ? { location: searchParams.location }
      : {}),
    ageMin: searchParams.ageMin,
    ageMax: searchParams.ageMax,
    durationMinutes: String(durationMinutes),
  });

  if (
    searchParams.locationMode === "nearby" &&
    searchParams.lat &&
    searchParams.lng
  ) {
    params.set("lat", searchParams.lat);
    params.set("lng", searchParams.lng);
  }

  if (searchParams.interests) {
    params.set("interests", searchParams.interests);
  }

  request.excludeMissionIds?.forEach((excludedMissionId) =>
    params.append("excludeMissionId", excludedMissionId),
  );
  if (request.missionId) params.set("missionId", request.missionId);

  return `/api/recommendations?${params.toString()}`;
}

/**
 * Fetches recommendation from the API and classifies errors / results.
 */
export function parseRecommendationApiResponse(
  status: number,
  body: RecommendationResponse | ApiErrorResponse,
): FetchRecommendationResult {
  if (status >= 200 && status < 300) {
    return {
      type: "success",
      recommendation: (body as RecommendationResponse).recommendation,
    };
  }

  const apiError = (body as ApiErrorResponse).error;
  if (
    apiError?.field === "location" &&
    ["INVALID_INPUT", "LOCATION_NOT_FOUND", "AMBIGUOUS_LOCATION"].includes(
      apiError.code || "",
    )
  ) {
    return {
      type: "location_error",
      errorCode: apiError.code || "INVALID_INPUT",
    };
  }

  return {
    type: "error",
    message: "Recommendation request failed",
  };
}
