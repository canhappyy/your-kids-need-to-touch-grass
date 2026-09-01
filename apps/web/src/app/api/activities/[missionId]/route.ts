import { NextResponse } from "next/server";
import { activityParamsSchema } from "@/server/schemas/activity.schema";
import { getActivityById } from "@/server/services/activity.service";

type RouteContext = {
  params: Promise<{
    missionId: string;
  }>;
};

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
