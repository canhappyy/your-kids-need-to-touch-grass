import { NextRequest, NextResponse } from "next/server";
import { openSpaceQuerySchema } from "@/server/schemas/open-space.schema";
import { getAllOpenSpaces } from "@/server/services/open-space.service";

/**
 * Handles GET requests to retrieve open space venues, optionally filtered by category.
 *
 * @param request - Next.js HTTP request containing optional `category` search parameter.
 * @returns JSON array of open space locations, 400 for invalid category, or 500 on server error.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const result = openSpaceQuerySchema.safeParse({
      category: searchParams.get("category") ?? undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid open space category" },
        { status: 400 },
      );
    }

    const openSpaces = await getAllOpenSpaces(result.data.category);

    return NextResponse.json(openSpaces);
  } catch (error) {
    console.error("Failed to fetch open spaces:", error);

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
