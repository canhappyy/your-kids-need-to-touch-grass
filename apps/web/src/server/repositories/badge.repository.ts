import pool from "@/lib/db";

/**
 * Raw database record representing an Australian native wildlife achievement badge.
 */
export type RawSpeciesBadge = {
  /** Common English name of the species (e.g. "Eastern Grey Kangaroo", "Koala"). */
  vernacular_name: string;
  /** Categorical classification of the badge (e.g. "Streak", "Variety", "Milestone"). */
  badge_type: string;
  /** Human-readable explanation of how to unlock the badge. */
  requirement: string;
  /** Unique primary key identifier for the badge (e.g. "koala", "saltwater-crocodile"). */
  badge_id: string;
  /** Evaluator rule engine type classification (e.g. "streak_days", "total_completed"). */
  rule_type: string;
  /** Specific activity record property evaluated by the rule, or null. */
  rule_field: string | null;
  /** Comparison operator (e.g. "gte", "lte", "equals", "contains"). */
  rule_operator: string;
  /** Target threshold value required for the rule condition to pass. */
  rule_value: string;
  /** Educational fun fact or natural history description about the species. */
  description: string;
  /** File path or asset filename for the full-colour unlocked badge illustration. */
  image_earned: string;
  /** File path or asset filename for the locked/silhouette badge illustration. */
  image_locked: string;
  /** Visual sorting priority weight in the rewards trophy gallery. */
  unlock_priority?: number;
  /** Progression achievement tier (e.g. 1 for bronze, 2 for silver, 3 for gold). */
  unlock_tier?: number;
};

/**
 * Retrieves all wildlife species badges from the database.
 * Orders badges alphabetically by species name for a stable, predictable gallery layout.
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
      image_locked,
      unlock_priority,
      unlock_tier
    FROM species_badge
    ORDER BY vernacular_name;
  `);

  return result.rows;
}
