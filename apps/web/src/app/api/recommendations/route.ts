// src/app/api/recommendations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/server/services/recommendation.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const postcode = searchParams.get("postcode");
    const age = Number(searchParams.get("age"));
    const duration = Number(searchParams.get("duration"));

    if (!postcode || !age || !duration) {
      return NextResponse.json(
        {
          error: "postcode, age and duration are required",
        },
        {
          status: 400,
        },
      );
    }

    const recommendations = await getRecommendations({
      postcode,
      age,
      duration,
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Failed to generate recommendations:", error);

    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
      },
      {
        status: 500,
      },
    );
  }
}
