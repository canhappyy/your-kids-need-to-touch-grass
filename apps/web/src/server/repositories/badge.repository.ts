import pool from "@/lib/db";

export type RawSpeciesBadge = {
  animal_name: string;
  badge_category: string;
  requirement: string;
};

/**
 * Retrieves all species badges from the database.
 * Orders streak badges first by milestone requirement (ascending),
 * followed by any other badge categories.
 *
 * @returns A promise resolving to an array of raw species badge records.
 */
export async function findAllSpeciesBadges(): Promise<RawSpeciesBadge[]> {
  const result = await pool.query<RawSpeciesBadge>(`
    SELECT
      animal_name,
      badge_category,
      requirement
    FROM species_badge
    ORDER BY
      badge_category,
      CASE
        WHEN requirement ~ '^[0-9]+$' THEN requirement::int
        ELSE 9999
      END ASC,
      animal_name ASC;
  `);

  return result.rows;
}
