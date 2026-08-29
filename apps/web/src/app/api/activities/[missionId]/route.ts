import { NextResponse } from "next/server";
import { getActivityById } from "@/server/services/activity.service";

type RouteContext = {
  params: Promise<{
    missionId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { missionId } = await context.params;

    const activity = await getActivityById(missionId);

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
