import { NextRequest, NextResponse } from "next/server";
import { openSpaceQuerySchema } from "@/server/schemas/open-space.schema";
import { getAllOpenSpaces } from "@/server/services/open-space.service";

/**
 * Handles HTTP GET requests to retrieve public open spaces, optionally filtered by category.
 *
 * This endpoint allows users and UI components to search or list public recreational spaces
 * across Victoria (parks, playgrounds, sports ovals, nature trails).
 * An optional `category` query parameter can be provided to filter results.
 *
 * Responses:
 * - `200 OK`: Returns an array of matching open space objects.
 * - `400 Bad Request`: If the category query parameter is invalid.
 * - `500 Internal Server Error`: If a server or database error occurs.
 *
 * @param request - The Next.js HTTP request containing optional `category` query param.
 * @returns JSON response with the array of open spaces or error details.
 *
 * @example
 * ```http
 * GET /api/open-spaces?category=Playground
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters from request URL
    const { searchParams } = new URL(request.url);

    // Validate the optional category parameter using the Zod schema
    const result = openSpaceQuerySchema.safeParse({
      category: searchParams.get("category") ?? undefined,
    });

    // Return 400 Bad Request if validation fails
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid open space category" },
        { status: 400 },
      );
    }

    // Query open spaces matching the category or all open spaces
    const openSpaces = await getAllOpenSpaces(result.data.category);

    // Return 200 OK with open space list
    return NextResponse.json(openSpaces);
  } catch (error) {
    // Log server errors
    console.error("Failed to fetch open spaces:", error);

    // Return 500 Internal Server Error
    return NextResponse.json(
      {
        error: "Failed to fetch open spaces",
      },
      {
        status: 500,
      },
    );
  }
}

