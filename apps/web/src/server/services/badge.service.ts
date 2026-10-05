import {
  findAllSpeciesBadges,
  type RawSpeciesBadge,
} from "@/server/repositories/badge.repository";
import type { MilestoneBadge } from "@/types/reward";

const ANIMAL_ICONS: Record<string, string> = {
  "koala": "🐨",
  "green turtle": "🐢",
  "green sea turtle": "🐢",
  "saltwater crocodile": "🐊",
  "red kangaroo": "🦘",
  "kangaroo": "🦘",
  "sugar glider": "🐿️",
  "tasmanian devil": "🦡",
  "dingo": "🐕",
  "australian hump-backed dolphin": "🐬",
};

/**
 * Maps database animal names to frontend badge IDs to preserve backward
 * compatibility with previously unlocked badge IDs in localStorage.
 */
const KNOWN_BADGE_IDS: Record<string, string> = {
  "koala": "koala",
  "green turtle": "green-sea-turtle",
  "green sea turtle": "green-sea-turtle",
  "saltwater crocodile": "saltwater-crocodile",
  "red kangaroo": "kangaroo",
  "kangaroo": "kangaroo",
};

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatSpeciesBadge(raw: RawSpeciesBadge): MilestoneBadge {
  const normalizedName = raw.animal_name.trim().toLowerCase();
  const id = KNOWN_BADGE_IDS[normalizedName] ?? slugifyName(raw.animal_name);
  const icon = ANIMAL_ICONS[normalizedName] ?? "🏅";
  const milestoneDays =
    raw.badge_category === "Streak" || /^\d+$/.test(raw.requirement.trim())
      ? parseInt(raw.requirement, 10) || 0
      : 0;

  return {
    id,
    milestoneDays,
    speciesName: raw.animal_name,
    icon,
    category: raw.badge_category,
    requirement: raw.requirement,
  };
}

/**
 * Retrieves all badges from the database and maps them to MilestoneBadge models.
 *
 * @returns A promise resolving to an array of formatted MilestoneBadge items.
 */
export async function getAllSpeciesBadges(): Promise<MilestoneBadge[]> {
  const rows = await findAllSpeciesBadges();
  return rows.map(formatSpeciesBadge);
}
