import { NextResponse } from "next/server";
import { getAllSpeciesBadges } from "@/server/services/badge.service";

/**
 * Handles HTTP GET requests to retrieve the complete collection of wildlife species badges.
 *
 * This endpoint supplies the Rewards Gallery with all available Victorian animal badges,
 * including their title, tier level, custom SVG artwork asset paths, and unlock criteria.
 * Badges celebrate milestones like outdoor play time, consecutive daily streaks, and missions completed.
 *
 * Responses:
 * - `200 OK`: Returns an array of species badge objects.
 * - `500 Internal Server Error`: Returned when the database query or service layer encounters an error.
 *
 * @returns A JSON response with the wildlife badges catalogue or an error description.
 *
 * @example
 * ```http
 * GET /api/badges
 * ```
 */
export async function GET() {
  try {
    // Query badge catalog from the badge service
    const badges = await getAllSpeciesBadges();

    // Return badges array with 200 OK
    return NextResponse.json(badges);
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

