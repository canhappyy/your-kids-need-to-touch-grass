import {
  findAllSpeciesBadges,
  type RawSpeciesBadge,
} from "@/server/repositories/badge.repository";
import type { MilestoneBadge } from "@/types/reward";

/**
 * Maps a database badge row directly to the frontend model.
 * Asset filenames and rule definitions are owned by species_badge_db.csv.
 */
export function formatSpeciesBadge(raw: RawSpeciesBadge): MilestoneBadge {
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
  };
}

export async function getAllSpeciesBadges(): Promise<MilestoneBadge[]> {
  const rows = await findAllSpeciesBadges();
  return rows.map(formatSpeciesBadge);
}
