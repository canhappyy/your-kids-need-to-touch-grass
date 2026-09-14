import { NextResponse } from "next/server";

import { chainedRecommendationQuerySchema } from "@/server/schemas/chained-recommendation.schema";
import { LocationResolutionError } from "@/server/services/location.service";
import { getChainedRecommendation } from "@/server/services/recommendation.service";
import { getMissionWeather } from "@/server/services/weather.service";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: NO_STORE_HEADERS },
  );
}

/** Returns a compatible second activity at the primary mission's venue. */
export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const parsed = chainedRecommendationQuerySchema.safeParse({
      playStyle: searchParams.get("playStyle") ?? undefined,
      canSupervise: searchParams.get("canSupervise") ?? undefined,
      location: searchParams.get("location") ?? undefined,
      lat: searchParams.get("lat") ?? undefined,
      lng: searchParams.get("lng") ?? undefined,
      ageMin: searchParams.get("ageMin"),
      ageMax: searchParams.get("ageMax"),
      primaryMissionId: searchParams.get("primaryMissionId"),
      openSpaceId: searchParams.get("openSpaceId"),
      secondaryMissionId:
        searchParams.get("secondaryMissionId") ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse(400, "INVALID_INPUT", "Invalid chain request.");
    }

    const result = await getChainedRecommendation(parsed.data);
    if (!result) {
      return NextResponse.json(
        { recommendation: null },
        { headers: NO_STORE_HEADERS },
      );
    }

    const weather = await getMissionWeather(
      result.recommendation.venue,
      result.outingTotalMinutes,
    );
    return NextResponse.json(
      { recommendation: { ...result.recommendation, weather } },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    if (error instanceof LocationResolutionError) {
      return errorResponse(error.status, error.code, error.message);
    }
    console.error("Failed to chain recommendation:", error);
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Unable to add another activity.",
    );
  }
}
