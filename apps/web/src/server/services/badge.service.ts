import {
  findAllSpeciesBadges,
  type RawSpeciesBadge,
} from "@/server/repositories/badge.repository";
import type { MilestoneBadge } from "@/types/reward";

const ANIMAL_ICONS: Record<string, string> = {
  "rainbow lorikeet": "rainbow_lorikeet.svg",
  "sulphur-crested cockatoo": "cockatoo.svg",
  "koala": "koala.svg",
  "green turtle": "green_turtle.svg",
  "short-beaked echidna": "echidna.svg",
  "blue-winged kookaburra": "kookaburra.svg",
  "saltwater crocodile": "saltwater_crocodile.svg",
  "red kangaroo": "red_kangaroo.svg",
  "dingo": "dingo.svg",
  "southern emu-wren": "emu_wren.svg",
  "tasmanian devil": "tasmanian_devil.svg",
  "sugar glider": "sugar_glider.svg",
  "platypus": "platypus.svg",
  "australian hump-backed dolphin": "humpback_dolphin.svg",
  "quokka": "quokka.svg",
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
  const normalizedName = raw.vernacular_name.trim().toLowerCase();
  const id = KNOWN_BADGE_IDS[normalizedName] ?? slugifyName(raw.vernacular_name);
  const icon = ANIMAL_ICONS[normalizedName];
  if (!icon) {
    throw new Error(`No badge asset configured for ${raw.vernacular_name}`);
  }
  const milestoneDays =
    raw.target_metric === "consecutive_days"
      ? parseInt(raw.target_value, 10) || 0
      : 0;

  return {
    id,
    milestoneDays,
    speciesName: raw.vernacular_name,
    icon,
    lockedIcon: icon.replace(".svg", "_locked.svg"),
    category: raw.badge_type,
    requirement: raw.target_value,
    targetMetric: raw.target_metric,
    targetValue: raw.target_value,
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
