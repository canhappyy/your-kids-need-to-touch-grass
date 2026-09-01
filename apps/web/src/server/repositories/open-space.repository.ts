import pool from "@/lib/db";

/**
 * Retrieves all open spaces from the database ordered alphabetically by name.
 *
 * @returns A promise resolving to an array of raw open space records.
 */
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

/**
 * Retrieves open spaces belonging to a specific category.
 *
 * @param category - The open space category name to filter by (e.g. "Park", "Playground").
 * @returns A promise resolving to an array of matching open space records.
 */
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
