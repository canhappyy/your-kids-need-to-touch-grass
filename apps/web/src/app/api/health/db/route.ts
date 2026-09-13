import { NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * Handles GET requests to check PostgreSQL database connectivity.
 *
 * Runs a lightweight query (`SELECT NOW()`) to verify pool connection health.
 *
 * @returns JSON response with connection status and database timestamp, or 500 on disconnection.
 */
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
