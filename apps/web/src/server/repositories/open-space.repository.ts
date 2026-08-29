import pool from "@/lib/db";

export async function findAllOpenSpaces() {
  const result = await pool.query(`
    SELECT
      open_space_id,
      name,
      latitude,
      longitude,
      category
    FROM open_space
    ORDER BY name;
  `);

  return result.rows;
}

export async function findOpenSpacesByCategory(category: string) {
  const result = await pool.query(
    `
    SELECT
      open_space_id,
      name,
      latitude,
      longitude,
      category
    FROM open_space
    WHERE category = $1
    ORDER BY name;
    `,
    [category],
  );

  return result.rows;
}
