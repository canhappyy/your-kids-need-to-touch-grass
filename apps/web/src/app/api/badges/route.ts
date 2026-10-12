import { NextResponse, NextRequest } from "next/server";
import { getAllSpeciesBadges } from "@/server/services/badge.service";

/**
* Handles HTTP GET requests to retrieve wildlife species badges with pagination support.
*
* This endpoint supplies the Rewards Gallery with available Victorian animal badges,
* including their title, tier level, custom SVG artwork asset paths, and unlock criteria.
* Badges celebrate milestones like outdoor play time, consecutive daily streaks, and missions completed.
*
* Query Parameters:
* - `limit`: Number of badges per page (default: 10, max: 50)
* - `offset`: Number of badges to skip (default: 0)
*
* Responses:
* - `200 OK`: Returns paginated badge results with metadata.
* - `400 Bad Request`: When limit or offset parameters are invalid.
* - `500 Internal Server Error`: Returned when the database query or service layer encounters an error.
*
* @param request - The HTTP request object.
* @returns A JSON response with paginated badges, total count, and pagination metadata.
*
* @example
* ```http
* GET /api/badges?limit=10&offset=0
* ```
*/
export async function GET(request: NextRequest) {
  try {
    // Parse pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    // Default pagination values
    const DEFAULT_LIMIT = 10;
    const MAX_LIMIT = 50;
    const DEFAULT_OFFSET = 0;

    // Validate and parse limit parameter
    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { error: "Invalid limit parameter. Must be a positive integer." },
          { status: 400 },
        );
      }
      limit = Math.min(parsedLimit, MAX_LIMIT);
    }

    // Validate and parse offset parameter
    let offset = DEFAULT_OFFSET;
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          { error: "Invalid offset parameter. Must be a non-negative integer." },
          { status: 400 },
        );
      }
      offset = parsedOffset;
    }

    // Query badge catalog from the badge service
    const allBadges = await getAllSpeciesBadges();

    // Calculate total count
    const totalCount = allBadges.length;

    // Implement pagination
    const paginatedBadges = allBadges.slice(offset, offset + limit);

    // Return paginated response with metadata
    return NextResponse.json({
      data: paginatedBadges,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    // Log database or service error
    console.error("Failed to fetch species badges:", error);

    // Return structured 500 error
    return NextResponse.json(
      { error: "Failed to fetch species badges" },
      { status: 500 },
    );
  }
}
