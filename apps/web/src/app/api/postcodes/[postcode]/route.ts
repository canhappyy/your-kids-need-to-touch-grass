import { NextResponse } from "next/server";
import {
  getPostcode,
  isValidPostcode,
} from "@/server/services/postcode.service";

type RouteContext = {
  params: Promise<{
    postcode: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { postcode } = await context.params;

    if (!isValidPostcode(postcode)) {
      return NextResponse.json(
        {
          error: "Postcode must contain exactly 4 digits",
        },
        {
          status: 400,
        },
      );
    }

    const result = await getPostcode(postcode);

    if (!result) {
      return NextResponse.json(
        {
          error: "Postcode not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch postcode:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch postcode",
      },
      {
        status: 500,
      },
    );
  }
}
