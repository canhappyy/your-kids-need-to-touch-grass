import { NextResponse } from "next/server";

import { LocationResolutionError } from "@/server/services/location.service";
import { recommendationQuerySchema } from "@/server/schemas/recommendation.schema";
import {
  getRecommendation,
  type RecommendationInput,
} from "@/server/services/recommendation.service";

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

export function parseRecommendationQuery(
  searchParams: URLSearchParams,
): RecommendationInput | null {
  const result = recommendationQuerySchema.safeParse({
    locationMode: searchParams.get("locationMode") ?? "nearby",
    location: searchParams.get("location") ?? undefined,
    ageMin: searchParams.get("ageMin"),
    ageMax: searchParams.get("ageMax"),
    durationMinutes: searchParams.get("durationMinutes"),
    excludeMissionIds: searchParams.getAll("excludeMissionId"),
    missionId: searchParams.get("missionId") ?? undefined,
  });

  return result.success ? result.data : null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = parseRecommendationQuery(searchParams);

    if (!input) {
      return errorResponse(
        400,
        "INVALID_INPUT",
        "Enter a valid location, age range, and duration.",
      );
    }

    const recommendation = await getRecommendation(input);

    return NextResponse.json(
      { recommendation },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    if (error instanceof LocationResolutionError) {
      return errorResponse(error.status, error.code, error.message, "location");
    }

    console.error("Failed to generate recommendations:", error);

    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Unable to generate a recommendation.",
    );
  }
}
