import pool from "@/lib/db";

export type RawSpeciesBadge = {
  vernacular_name: string;
  badge_type: string;
  target_metric: string;
  target_value: string;
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
      vernacular_name,
      badge_type,
      target_metric,
      target_value
    FROM species_badge
    ORDER BY vernacular_name;
  `);

  return result.rows;
}
