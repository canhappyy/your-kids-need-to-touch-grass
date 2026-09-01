import { NextResponse } from "next/server";
import { postcodeParamsSchema } from "@/server/schemas/postcode.schema";
import { getPostcode } from "@/server/services/postcode.service";

type RouteContext = {
  params: Promise<{
    postcode: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const params = postcodeParamsSchema.safeParse(await context.params);

    if (!params.success) {
      return NextResponse.json(
        {
          error: "Postcode must contain exactly 4 digits",
        },
        {
          status: 400,
        },
      );
    }

    const result = await getPostcode(params.data.postcode);

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
