import { NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * Handles HTTP GET requests to check PostgreSQL database connectivity and health.
 *
 * Runs a lightweight query (`SELECT NOW()`) to verify that the pg connection pool
 * can successfully establish a handshake and execute queries against the database.
 * Used by automated deployment monitors, container orchestrators, and system status checks.
 *
 * Responses:
 * - `200 OK`: Database is healthy and responsive, returns current timestamp.
 * - `500 Internal Server Error`: Database is disconnected or unreachable.
 *
 * @returns JSON response with connection status and current timestamp, or error on failure.
 *
 * @example
 * ```http
 * GET /api/health/db
 * ```
 */
export async function GET() {
  try {
    // Execute a fast timestamp query to verify database liveliness
    const result = await pool.query("SELECT NOW() AS current_time");

    // Return status ok with server timestamp
    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp: result.rows[0].current_time,
    });
  } catch (error) {
    // Log database connectivity failure
    console.error("Database connection failed:", error);

    // Return 500 status indicating disconnected state
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

