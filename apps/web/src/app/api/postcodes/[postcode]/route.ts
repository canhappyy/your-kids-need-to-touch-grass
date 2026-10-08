import { NextResponse } from "next/server";
import { postcodeParamsSchema } from "@/server/schemas/postcode.schema";
import { getPostcode } from "@/server/services/postcode.service";

/**
 * Route parameter context provided by Next.js App Router for dynamic route `[postcode]`.
 */
type RouteContext = {
  params: Promise<{
    postcode: string;
  }>;
};

/**
 * Handles HTTP GET requests to retrieve geographic coordinates and suburb names for a 4-digit Victorian postcode.
 *
 * Used during user onboarding, home search form location auto-complete, and map positioning.
 *
 * Responses:
 * - `200 OK`: Returns the postcode details with latitude, longitude, and array of suburb names.
 * - `400 Bad Request`: If the postcode parameter is not exactly 4 digits.
 * - `404 Not Found`: If the postcode is not found in the Victorian directory.
 * - `500 Internal Server Error`: If a database error occurs.
 *
 * @param request - Incoming HTTP Request.
 * @param context - Route context containing async route parameters (postcode).
 * @returns JSON response with postcode details or an error message.
 *
 * @example
 * ```http
 * GET /api/postcodes/3168
 * ```
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    // Validate that the route param is a 4-digit string
    const params = postcodeParamsSchema.safeParse(await context.params);

    // Return 400 Bad Request if the format is invalid
    if (!params.success) {
      return NextResponse.json(
        {
          error: "Postcode must contain exactly 4 digits",
        },
        {
          status: 400,
        },
      );
    }

    // Query database for the postcode details
    const result = await getPostcode(params.data.postcode);

    // Return 404 Not Found if the postcode is not registered in the system
    if (!result) {
      return NextResponse.json(
        {
          error: "Postcode not found",
        },
        {
          status: 404,
        },
      );
    }

    // Return 200 OK with the coordinates and suburbs
    return NextResponse.json(result);
  } catch (error) {
    // Log unexpected errors
    console.error("Failed to fetch postcode:", error);

    // Return 500 Internal Server Error
    return NextResponse.json(
      {
        error: "Failed to fetch postcode",
      },
      {
        status: 500,
      },
    );
  }
}

