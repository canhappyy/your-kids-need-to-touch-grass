import {
  findAllSpeciesBadges,
  type RawSpeciesBadge,
} from "@/server/repositories/badge.repository";
import type { MilestoneBadge } from "@/types/reward";

/**
 * Maps a raw database badge row into a clean frontend `MilestoneBadge` domain model.
 *
 * Normalizes snake_case database columns into camelCase properties and computes
 * numeric streak thresholds (`milestoneDays`) when the rule type is `"streak_days"`.
 *
 * @param raw - Raw database record from the `species_badge` table.
 * @returns Formatted `MilestoneBadge` domain object.
 */
export function formatSpeciesBadge(raw: RawSpeciesBadge): MilestoneBadge {
  // If the badge rule evaluates a streak day threshold, extract it into milestoneDays
  const milestoneDays =
    raw.rule_type === "streak_days" && raw.rule_operator === "gte"
      ? Number(raw.rule_value) || 0
      : 0;

  return {
    id: raw.badge_id,
    milestoneDays,
    speciesName: raw.vernacular_name,
    icon: raw.image_earned,
    lockedIcon: raw.image_locked,
    category: raw.badge_type,
    requirement: raw.requirement,
    ruleType: raw.rule_type,
    ruleField: raw.rule_field ?? undefined,
    ruleOperator: raw.rule_operator,
    ruleValue: raw.rule_value,
    description: raw.description,
    ...(raw.unlock_priority !== undefined
      ? { unlockPriority: raw.unlock_priority }
      : {}),
    ...(raw.unlock_tier !== undefined ? { unlockTier: raw.unlock_tier } : {}),
  };
}

/**
 * Retrieves and formats all Australian native wildlife species badges from the database.
 *
 * @returns A promise resolving to an array of formatted `MilestoneBadge` objects.
 */
export async function getAllSpeciesBadges(): Promise<MilestoneBadge[]> {
  const rows = await findAllSpeciesBadges();
  return rows.map(formatSpeciesBadge);
}
