import { getMissionWeather } from "@/server/services/weather.service";
import { NextResponse } from "next/server";

import { LocationResolutionError } from "@/server/services/location.service";
import {
  recommendationBodySchema,
  recommendationQuerySchema,
} from "@/server/schemas/recommendation.schema";
import { getRecommendation } from "@/server/services/recommendation.service";
import type { RecommendationInput } from "@/types/recommendation";

export const runtime = "nodejs";

type ApiErrorCode =
  | "INVALID_INPUT"
  | "LOCATION_NOT_FOUND"
  | "AMBIGUOUS_LOCATION"
  | "INTERNAL_ERROR";

type ApiError = {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: "location";
  };
};

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  field?: "location",
) {
  const body: ApiError = {
    error: { code, message, ...(field ? { field } : {}) },
  };

  return NextResponse.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

/**
 * Parses and validates recommendation search query parameters from an incoming request.
 *
 * Extracts parameters such as play style, supervision status, age limits, duration,
 * GPS coordinates, and excluded mission IDs. Validates them through the Zod schema.
 *
 * @param searchParams - The URL search parameters from the request.
 * @returns A validated `RecommendationInput` object, or `null` if validation fails.
 */
function parseRecommendationQuery(
  searchParams: URLSearchParams,
): RecommendationInput | null {
  const result = recommendationQuerySchema.safeParse({
    playStyle: searchParams.get("playStyle") ?? undefined,
    canSupervise: searchParams.get("canSupervise") ?? undefined,
    locationMode: searchParams.get("locationMode") ?? "nearby",
    location: searchParams.get("location") ?? undefined,
    lat: searchParams.get("lat") ?? undefined,
    lng: searchParams.get("lng") ?? undefined,
    ageMin: searchParams.get("ageMin"),
    ageMax: searchParams.get("ageMax"),
    durationMinutes: searchParams.get("durationMinutes"),
    excludeMissionIds: searchParams.getAll("excludeMissionId"),
    missionId: searchParams.get("missionId") ?? undefined,
  });

  return result.success ? result.data : null;
}

/**
 * Handles HTTP GET requests to generate a personalized activity recommendation.
 *
 * High-Level Request Pipeline:
 * 1. **Parse & Validate:** Validates query string parameters (age, duration, location, preferences).
 * 2. **Recommendation Engine:** Evaluates candidate activities matching age suitability and duration.
 * 3. **Live Weather & UV Assessment:** If outdoor activity is chosen, checks current weather and UV index.
 * 4. **Child UV Safety Switch:** If UV index is extreme (>= 10), automatically swaps recommendation to
 *    an engaging indoor/at-home activity and alerts the parent with an explanatory notice.
 * 5. **Structured Error Handling:** Catches ambiguous or unknown locations and provides clear guidance.
 *
 * Responses:
 * - `200 OK`: Returns the recommendation object (with optional weather assessment and safety notice).
 * - `400 Bad Request`: On missing or invalid search inputs.
 * - `404 Not Found`: If a specified location cannot be resolved.
 * - `409 Conflict`: If a location name matches multiple ambiguous suburbs.
 * - `500 Internal Server Error`: On unexpected recommendation engine failures.
 *
 * @param request - Incoming HTTP request with query parameters.
 * @returns JSON response containing the recommendation or a structured error response.
 *
 * @example
 * ```http
 * GET /api/recommendations?ageMin=6&ageMax=9&durationMinutes=45&locationMode=nearby&location=3168
 * ```
 */
async function recommendationResponse(input: RecommendationInput | null) {
  if (!input) {
    return errorResponse(
      400,
      "INVALID_INPUT",
      "Enter a valid location, age range, and duration.",
    );
  }

  try {
    // Generate preliminary recommendation based on parent's criteria
    let recommendation = await getRecommendation(input);
    let weatherNotice: string | undefined;

    // Fetch live weather data for the outdoor venue (temperature, rain probability, UV index)
    let weather = recommendation
      ? await getMissionWeather(recommendation.venue, recommendation.totalMinutes)
      : undefined;

    // UV Safety Protection: If outdoor play has extreme UV (index >= 10), switch to indoor play
    if (
      input.locationMode === "nearby" &&
      weather?.status === "available" &&
      weather.maxUvIndex !== undefined &&
      weather.maxUvIndex >= 10
    ) {
      // Re-run recommendation specifically requesting home-based indoor activity
      recommendation = await getRecommendation({
        ageMin: input.ageMin,
        ageMax: input.ageMax,
        durationMinutes: input.durationMinutes,
        playStyle: input.playStyle,
        canSupervise: input.canSupervise,
        excludeMissionIds: input.excludeMissionIds,
        missionId: input.missionId,
        interests: input.interests,
        locationMode: "home",
        homeBasedOnly: true,
      });

      // Provide friendly advisory notice to the parent
      weatherNotice = recommendation
        ? "Extreme UV: recommending an indoor activity."
        : undefined;

      // Outdoor weather is not applicable for indoor replacement activity
      weather = recommendation ? { status: "unavailable" } : undefined;
    }

    // Return the final recommendation payload with no-store cache headers
    return NextResponse.json(
      {
        recommendation: recommendation
          ? { ...recommendation, weather, weatherNotice }
          : null,
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    // Handle location errors (e.g. unknown postcode or ambiguous suburb name)
    if (error instanceof LocationResolutionError) {
      return errorResponse(error.status, error.code, error.message, "location");
    }

    console.error("Failed to generate recommendations.", {
      errorClass: error instanceof Error ? error.name : "UnknownError",
    });

    // Return 500 error on unexpected failures
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Unable to generate a recommendation.",
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return recommendationResponse(parseRecommendationQuery(searchParams));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      400,
      "INVALID_INPUT",
      "Enter a valid location, age range, and duration.",
    );
  }

  const parsed = recommendationBodySchema.safeParse(body);
  return recommendationResponse(parsed.success ? parsed.data : null);
}
