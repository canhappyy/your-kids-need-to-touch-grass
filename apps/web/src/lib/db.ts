import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

/**
 * Shared PostgreSQL connection pool instance configured with `DATABASE_URL`.
 * Reuses active client connections across incoming API requests.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
