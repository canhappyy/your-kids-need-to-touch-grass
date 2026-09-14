import { NextResponse } from "next/server";
import { getAllActivities } from "@/server/services/activity.service";

/**
 * Handles GET requests to retrieve the complete catalogue of activity missions.
 *
 * @returns A JSON array of activity objects, or a 500 error response on database failure.
 */
export async function GET() {
  try {
    const activities = await getAllActivities();

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Failed to fetch activities:", error);

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
