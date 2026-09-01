import { NextResponse } from "next/server";

import { nearestPostcodeBodySchema } from "@/server/schemas/postcode.schema";
import { getNearestPostcode } from "@/server/services/postcode.service";

export const runtime = "nodejs";

type ErrorCode = "INVALID_INPUT" | "LOCATION_NOT_FOUND" | "INTERNAL_ERROR";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function errorResponse(status: number, code: ErrorCode, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const result = nearestPostcodeBodySchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        400,
        "INVALID_INPUT",
        "Valid latitude and longitude are required.",
      );
    }

    const { latitude, longitude } = result.data;

    const postcode = await getNearestPostcode(latitude, longitude);

    if (!postcode) {
      return errorResponse(
        404,
        "LOCATION_NOT_FOUND",
        "No supported postcode found near your location.",
      );
    }

    return NextResponse.json(postcode, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse(
        400,
        "INVALID_INPUT",
        "Valid latitude and longitude are required.",
      );
    }

    console.error("Failed to resolve GPS location:", error);

    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Unable to resolve your location.",
    );
  }
}
