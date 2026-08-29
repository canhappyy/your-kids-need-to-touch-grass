import { NextRequest, NextResponse } from "next/server";
import { getAllOpenSpaces } from "@/server/services/open-space.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") ?? undefined;

    const openSpaces = await getAllOpenSpaces(category);

    return NextResponse.json(openSpaces);
  } catch (error) {
    console.error("Failed to fetch open spaces:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch open spaces",
      },
      {
        status: 500,
      },
    );
  }
}
