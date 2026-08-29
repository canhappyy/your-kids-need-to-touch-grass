import { NextResponse } from "next/server";
import { getAllActivities } from "@/server/services/activity.service";

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
