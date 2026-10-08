import pool from "@/lib/db";

export type RawSpeciesBadge = {
  vernacular_name: string;
  badge_type: string;
  requirement: string;
  badge_id: string;
  rule_type: string;
  rule_field: string | null;
  rule_operator: string;
  rule_value: string;
  description: string;
  image_earned: string;
  image_locked: string;
};

/**
 * Retrieves all species badges from the database.
 * Orders badges alphabetically by species name for a stable gallery.
 *
 * @returns A promise resolving to an array of raw species badge records.
 */
export async function findAllSpeciesBadges(): Promise<RawSpeciesBadge[]> {
  const result = await pool.query<RawSpeciesBadge>(`
    SELECT
      vernacular_name,
      badge_type,
      requirement,
      badge_id,
      rule_type,
      rule_field,
      rule_operator,
      rule_value,
      description,
      image_earned,
      image_locked
    FROM species_badge
    ORDER BY vernacular_name;
  `);

  return result.rows;
}
