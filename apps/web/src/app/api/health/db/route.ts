import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");

    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
      },
      {
        status: 500,
      },
    );
  }
}
