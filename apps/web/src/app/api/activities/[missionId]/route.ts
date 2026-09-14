import { NextResponse } from "next/server";
import { activityParamsSchema } from "@/server/schemas/activity.schema";
import { getActivityById } from "@/server/services/activity.service";

type RouteContext = {
  params: Promise<{
    missionId: string;
  }>;
};

/**
 * Handles GET requests to retrieve a single activity mission by its unique mission ID.
 *
 * @param request - Incoming HTTP request.
 * @param context - Route context containing async route parameters (missionId).
 * @returns JSON response with the activity details, 400 for invalid ID format, 404 if not found, or 500 on server error.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const result = activityParamsSchema.safeParse(await context.params);

    if (!result.success) {
      return NextResponse.json(
        { error: "Mission ID must contain 1 to 50 characters" },
        { status: 400 },
      );
    }

    const activity = await getActivityById(result.data.missionId);

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

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Failed to fetch activity:", error);

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
