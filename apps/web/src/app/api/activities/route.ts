import { NextResponse } from "next/server";
import { getAllActivities } from "@/server/services/activity.service";

/**
 * Handles HTTP GET requests to retrieve the complete catalogue of activity missions.
 *
 * This endpoint queries the central PostgreSQL database for all missions (both home-based
 * and outdoor open-space activities). Each mission object includes details such as
 * title, description, equipment requirements, age group suitability, and estimated duration.
 *
 * Responses:
 * - `200 OK`: Returns an array of activity mission objects.
 * - `500 Internal Server Error`: Returns an error object if the database query fails.
 *
 * @returns A JSON response containing the array of activities or an error message.
 *
 * @example
 * ```http
 * GET /api/activities
 * ```
 */
export async function GET() {
  try {
    // Query all available missions from the database via activity service
    const activities = await getAllActivities();

    // Return the activities array as JSON with 200 OK status
    return NextResponse.json(activities);
  } catch (error) {
    // Log the error for server diagnostics
    console.error("Failed to fetch activities:", error);

    // Return a structured 500 error to the client
    return NextResponse.json(
      {
        error: "Failed to fetch activities",
      },
      {
        status: 500,
      },
    );
  }
}

