import { NextResponse } from "next/server";
import { getAllSpeciesBadges } from "@/server/services/badge.service";

/**
 * Handles GET requests to retrieve the complete list of wildlife badges.
 *
 * @returns A JSON array of species badge objects, or a 500 error response on failure.
 */
export async function GET() {
  try {
    const badges = await getAllSpeciesBadges();
    return NextResponse.json(badges);
  } catch (error) {
    console.error("Failed to fetch species badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch species badges" },
      { status: 500 },
    );
  }
}
