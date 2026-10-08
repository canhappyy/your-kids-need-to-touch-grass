import pool from "@/lib/db";

/**
 * Retrieves all open spaces from the database ordered alphabetically by name.
 *
 * This function queries the PostgreSQL `open_space` table for all public recreational spaces,
 * including their unique identifier, display name, GPS coordinates (latitude and longitude),
 * and primary category (such as "Park", "Playground", or "Sports Field").
 *
 * @returns A promise that resolves to an array of raw open space database records.
 *
 * @example
 * ```ts
 * const spaces = await findAllOpenSpaces();
 * console.log(`Found ${spaces.length} open spaces`);
 * ```
 */
export async function findAllOpenSpaces() {
  // Query all open spaces sorted alphabetically by name for a clean, consistent listing
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

  // Return the raw row records returned by the pg pool query
  return result.rows;
}

/**
 * Retrieves open spaces belonging to a specific category.
 *
 * Filters the public open space database by category type (such as "Park", "Nature Reserve",
 * or "Playground"). Uses parameterized SQL queries ($1) to ensure strict safety against SQL injection.
 *
 * @param category - The open space category name to filter by (e.g., "Park", "Playground").
 * @returns A promise that resolves to an array of matching open space records.
 *
 * @example
 * ```ts
 * const playgrounds = await findOpenSpacesByCategory("Playground");
 * ```
 */
export async function findOpenSpacesByCategory(category: string) {
  // Execute a parameterized query to securely filter by the category string
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

  // Return matching records
  return result.rows;
}

