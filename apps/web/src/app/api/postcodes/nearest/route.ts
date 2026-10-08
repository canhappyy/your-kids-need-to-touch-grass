import { NextResponse } from "next/server";

import { nearestPostcodeBodySchema } from "@/server/schemas/postcode.schema";
import { getNearestPostcode } from "@/server/services/postcode.service";

/**
 * Enforce Node.js runtime environment for database access and geo-calculations.
 */
export const runtime = "nodejs";

/**
 * Supported structured error codes returned by the nearest postcode API.
 */
type ErrorCode = "INVALID_INPUT" | "LOCATION_NOT_FOUND" | "INTERNAL_ERROR";

/**
 * HTTP Cache headers preventing browsers or proxies from caching dynamic location lookups.
 */
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * Helper to build a uniform JSON error response.
 *
 * @param status - HTTP status code (400, 404, 500).
 * @param code - Semantic error code string.
 * @param message - User-friendly English explanation.
 * @returns Next.js JSON response object.
 */
function errorResponse(status: number, code: ErrorCode, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: NO_STORE_HEADERS },
  );
}

/**
 * Handles HTTP POST requests to resolve GPS coordinates (latitude, longitude)
 * to the closest Victorian postcode using great-circle distance.
 *
 * Used when a parent clicks "Use My Current Location" on the home search page.
 * The browser sends device GPS coordinates, and this endpoint locates the nearest
 * Victorian postcode centroid within a 50km threshold.
 *
 * Responses:
 * - `200 OK`: Returns the nearest postcode and its associated suburb list.
 * - `400 Bad Request`: When latitude/longitude are missing, non-numeric, or malformed JSON.
 * - `404 Not Found`: When the coordinates are farther than 50km from any Victorian postcode.
 * - `500 Internal Server Error`: On unexpected database or server failure.
 *
 * @param request - HTTP request with JSON body containing `{ latitude, longitude }`.
 * @returns JSON response with the nearest postcode and suburbs, or structured error.
 *
 * @example
 * ```http
 * POST /api/postcodes/nearest
 * Content-Type: application/json
 *
 * { "latitude": -37.8136, "longitude": 144.9631 }
 * ```
 */
export async function POST(request: Request) {
  try {
    // Parse JSON body safely
    const body = (await request.json()) as unknown;

    // Validate coordinates with Zod schema
    const result = nearestPostcodeBodySchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        400,
        "INVALID_INPUT",
        "Valid latitude and longitude are required.",
      );
    }

    const { latitude, longitude } = result.data;

    // Resolve nearest postcode using Haversine calculation in PostgreSQL
    const postcode = await getNearestPostcode(latitude, longitude);

    if (!postcode) {
      return errorResponse(
        404,
        "LOCATION_NOT_FOUND",
        "No supported postcode found near your location.",
      );
    }

    // Return the matched postcode with no-store cache headers
    return NextResponse.json(postcode, { headers: NO_STORE_HEADERS });
  } catch (error) {
    // Handle malformed JSON input
    if (error instanceof SyntaxError) {
      return errorResponse(
        400,
        "INVALID_INPUT",
        "Valid latitude and longitude are required.",
      );
    }

    console.error("Failed to resolve GPS location:", error);

    // Return internal error for any unexpected exception
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Unable to resolve your location.",
    );
  }
}

