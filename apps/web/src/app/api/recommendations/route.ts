import { NextResponse } from "next/server";

import { LocationResolutionError } from "@/server/services/location.service";
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

function parseInteger(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseRecommendationQuery(
  searchParams: URLSearchParams,
): RecommendationInput | null {
  const locationMode = searchParams.get("locationMode") ?? "nearby";
  const location = searchParams.get("location")?.trim() ?? "";
  const ageMin = parseInteger(searchParams.get("ageMin"));
  const ageMax = parseInteger(searchParams.get("ageMax"));
  const durationMinutes = parseInteger(searchParams.get("durationMinutes"));
  const excludeMissionId =
    searchParams.get("excludeMissionId")?.trim() || undefined;

  if (
    (locationMode !== "nearby" && locationMode !== "home") ||
    (locationMode === "nearby" && (!location || location.length > 100)) ||
    ageMin === null ||
    ageMax === null ||
    ageMin < 5 ||
    ageMax > 12 ||
    ageMin > ageMax ||
    durationMinutes === null ||
    durationMinutes < 5 ||
    durationMinutes > 775 ||
    durationMinutes % 5 !== 0
  ) {
    return null;
  }

  const commonInput = {
    ageMin,
    ageMax,
    durationMinutes,
    ...(excludeMissionId ? { excludeMissionId } : {}),
  };

  return locationMode === "home"
    ? { ...commonInput, locationMode }
    : { ...commonInput, locationMode, location };
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
