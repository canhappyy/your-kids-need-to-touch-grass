import { NextResponse } from "next/server";
import { activityParamsSchema } from "@/server/schemas/activity.schema";
import { getActivityById } from "@/server/services/activity.service";

/**
 * Route parameter context provided by Next.js App Router for dynamic route `[missionId]`.
 */
type RouteContext = {
  params: Promise<{
    missionId: string;
  }>;
};

/**
 * Handles HTTP GET requests to retrieve a single activity mission by its unique ID.
 *
 * This endpoint validates the incoming dynamic route parameter `missionId` (e.g., "MIS-001")
 * against the Zod schema. If valid, it fetches the corresponding activity details from the database.
 *
 * Responses:
 * - `200 OK`: Returns the complete activity mission object.
 * - `400 Bad Request`: When the provided missionId is empty or exceeds 50 characters.
 * - `404 Not Found`: When no mission matches the provided ID in the database.
 * - `500 Internal Server Error`: When an unexpected server or database error occurs.
 *
 * @param request - The incoming HTTP Request object.
 * @param context - The Next.js route context containing the asynchronous route parameters.
 * @returns A JSON response with the mission data or an error description.
 *
 * @example
 * ```http
 * GET /api/activities/MIS-042
 * ```
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    // Await and parse dynamic URL route params using the Zod schema
    const result = activityParamsSchema.safeParse(await context.params);

    // If validation fails (e.g. invalid string length), return 400 Bad Request
    if (!result.success) {
      return NextResponse.json(
        { error: "Mission ID must contain 1 to 50 characters" },
        { status: 400 },
      );
    }

    // Query database for the requested activity
    const activity = await getActivityById(result.data.missionId);

    // If no matching activity was found in the database, return 404 Not Found
    if (!activity) {
      return NextResponse.json(
        {
          error: "Activity not found",
        },
        {
          status: 404,
        },
      );
    }

    // Return the activity mission details with 200 OK
    return NextResponse.json(activity);
  } catch (error) {
    // Log server errors for monitoring and debugging
    console.error("Failed to fetch activity:", error);

    // Return 500 Internal Server Error
    return NextResponse.json(
      {
        error: "Failed to fetch activity",
      },
      {
        status: 500,
      },
    );
  }
}

