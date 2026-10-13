import { playPreferenceParams } from "@/lib/play-preferences";
import type { RecommendationResponse } from "@/types/recommendation";
import type {
  ApiErrorResponse,
  FetchRecommendationResult,
  RecommendationApiRequestBody,
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
export function buildRecommendationApiRequest(
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
): RecommendationApiRequestBody {
  const durationMinutes =
    Number(searchParams.hours) * 60 + Number(searchParams.minutes);

  return {
    playStyle: searchParams.playStyle,
    canSupervise: searchParams.canSupervise,
    locationMode: searchParams.locationMode,
    ...(searchParams.locationMode === "nearby"
      ? { location: searchParams.location }
      : {}),
    ...(searchParams.locationMode === "nearby" &&
    searchParams.lat &&
    searchParams.lng
      ? {
          latitude: Number(searchParams.lat),
          longitude: Number(searchParams.lng),
        }
      : {}),
    ageMin: Number(searchParams.ageMin),
    ageMax: Number(searchParams.ageMax),
    durationMinutes,
    ...(searchParams.interests && !request.missionId
      ? { interests: searchParams.interests }
      : {}),
    ...(request.excludeMissionIds?.length
      ? { excludeMissionIds: request.excludeMissionIds }
      : {}),
    ...(request.missionId ? { missionId: request.missionId } : {}),
  };
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
