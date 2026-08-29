import pool from "@/lib/db";

export async function findPostcode(postcode: string) {
  const result = await pool.query(
    `
    SELECT
      postcode,
      latitude,
      longitude,
      suburbs
    FROM postcode
    WHERE postcode = $1;
    `,
    [postcode],
  );

  return result.rows[0] ?? null;
}
