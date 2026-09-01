import pool from "@/lib/db";
import type {
  AgeBand,
  MissionType,
  RecommendationVenue,
  SupervisionLevel,
} from "@/types/recommendation";

/**
 * Represents a raw recommendation candidate before match reasons are constructed.
 */
export type RecommendationCandidate = {
  /** Unique mission identifier. */
  missionId: string;
  /** Activity title. */
  title: string;
  /** Description or summary of the activity. */
  description: string | null;
  /** Required equipment description. */
  equipmentNeeded: string | null;
  /** Instructions for completing the activity. */
  instructionText: string | null;
  /** Duration in minutes. */
  durationMinutes: number;
  /** Mission category (Location-Based, Home-Based, Location-Agnostic). */
  missionType: MissionType;
  /** Age bands targeted by this activity. */
  ageBands: AgeBand[];
  /** Required supervision level. */
  supervisionLevel: SupervisionLevel;
  /** Venue details if location-based, or null for home/agnostic activities. */
  venue: RecommendationVenue | null;
};

/**
 * Query criteria for finding a location-based recommendation near coordinates.
 */
export type RecommendationQuery = {
  /** Target latitude. */
  latitude: number;
  /** Target longitude. */
  longitude: number;
  /** Minimum child age in years. */
  ageMin: number;
  /** Maximum child age in years. */
  ageMax: number;
  /** Maximum available time window in minutes. */
  durationMinutes: number;
  /** Optional array of mission IDs to deprioritize/exclude. */
  excludeMissionIds?: string[];
  /** Specific mission ID to target if requesting a particular mission. */
  missionId?: string;
};

/**
 * Query criteria for finding a home-based or location-agnostic fallback recommendation.
 */
export type FallbackRecommendationQuery = Omit<
  RecommendationQuery,
  "latitude" | "longitude"
> & {
  /** Array of mission types to match against. */
  missionTypes: Array<"Home-Based" | "Location-Agnostic">;
  /** Optional equipment required tag filter. */
  equipmentRequiredTag?: "None";
};

/**
 * Maps a database row into a `RecommendationCandidate` with venue information.
 *
 * @param row - Raw query row from location-based query.
 * @returns Structured `RecommendationCandidate` with populated venue.
 */
function mapLocationCandidate(
  row: Record<string, unknown>,
): RecommendationCandidate {
  return {
    missionId: String(row.mission_id),
    title: String(row.activity_title),
    description: row.description === null ? null : String(row.description),
    equipmentNeeded:
      row.equipment_needed === null ? null : String(row.equipment_needed),
    instructionText:
      row.instruction_text === null ? null : String(row.instruction_text),
    durationMinutes: Number(row.duration_minutes),
    missionType: "Location-Based",
    ageBands: mapAgeBands(row),
    supervisionLevel: String(row.supervision_level) as SupervisionLevel,
    venue: {
      openSpaceId: Number(row.open_space_id),
      name: String(row.open_space_name),
      category: String(row.category),
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      distanceKm: Math.round(Number(row.distance_km) * 100) / 100,
    },
  };
}

/**
 * Maps a database row into a `RecommendationCandidate` without venue information.
 *
 * @param row - Raw query row from fallback query.
 * @returns Structured `RecommendationCandidate` with `venue: null`.
 */
function mapFallbackCandidate(
  row: Record<string, unknown>,
): RecommendationCandidate {
  return {
    missionId: String(row.mission_id),
    title: String(row.activity_title),
    description: row.description === null ? null : String(row.description),
    equipmentNeeded:
      row.equipment_needed === null ? null : String(row.equipment_needed),
    instructionText:
      row.instruction_text === null ? null : String(row.instruction_text),
    durationMinutes: Number(row.duration_minutes),
    missionType: String(row.mission_type) as
      | "Home-Based"
      | "Location-Agnostic",
    ageBands: mapAgeBands(row),
    supervisionLevel: String(row.supervision_level) as SupervisionLevel,
    venue: null,
  };
}

/**
 * Maps age flags ('Y' / 'N') from database columns to `AgeBand` array.
 *
 * @param row - Raw database row containing age flags.
 * @returns Array of applicable `AgeBand` values ("5-7", "8-9", "10-12").
 */
function mapAgeBands(row: Record<string, unknown>): AgeBand[] {
  const ageBands: AgeBand[] = [];

  if (row.age_5_7 === "Y") ageBands.push("5-7");
  if (row.age_8_9 === "Y") ageBands.push("8-9");
  if (row.age_10_12 === "Y") ageBands.push("10-12");

  return ageBands;
}

/**
 * Searches for a location-based activity candidate within 10km of coordinates matching age and duration.
 *
 * @param input - The recommendation search criteria including coordinates, age bounds, and duration.
 * @returns A promise resolving to the closest matching `RecommendationCandidate`, or `null` if none found.
 */
export async function findLocationBasedRecommendation(
  input: RecommendationQuery,
): Promise<RecommendationCandidate | null> {
  const result = await pool.query(
    `
    WITH open_space_distances AS MATERIALIZED (
      SELECT
        os.open_space_id,
        os.name,
        os.latitude,
        os.longitude,
        os.category,
        6371 * acos(
          LEAST(
            1,
            GREATEST(
              -1,
              cos(radians($1)) * cos(radians(os.latitude))
                * cos(radians(os.longitude) - radians($2))
              + sin(radians($1)) * sin(radians(os.latitude))
            )
          )
        ) AS distance_km
      FROM open_space AS os
    ),
    nearest_per_mission AS (
      SELECT DISTINCT ON (a.mission_id)
        a.mission_id,
        a.activity_title,
        a.description,
        a.equipment_needed,
        a.instruction_text,
        a.duration_minutes,
        a.age_5_7,
        a.age_8_9,
        a.age_10_12,
        a.supervision_level,
        os.open_space_id,
        os.name AS open_space_name,
        os.category,
        os.latitude,
        os.longitude,
        os.distance_km
      FROM activity AS a
      INNER JOIN activity_location_category AS alc
        ON alc.mission_id = a.mission_id
      INNER JOIN open_space_distances AS os
        ON (
          alc.open_space_ref_id IS NOT NULL
          AND os.open_space_id = alc.open_space_ref_id
        ) OR (
          alc.open_space_ref_id IS NULL
          AND os.category = alc.category_name
        )
      WHERE a.mission_type = 'Location-Based'
        AND ($7::text IS NULL OR a.mission_id = $7)
        AND a.duration_minutes IS NOT NULL
        AND a.supervision_level IS NOT NULL
        AND a.duration_minutes <= $5
        AND os.distance_km <= 10
        AND (
          ($3 <= 7 AND $4 >= 5 AND a.age_5_7 = 'Y')
          OR ($3 <= 9 AND $4 >= 8 AND a.age_8_9 = 'Y')
          OR ($3 <= 12 AND $4 >= 10 AND a.age_10_12 = 'Y')
        )
      ORDER BY a.mission_id, os.distance_km, os.open_space_id
    )
    SELECT *
    FROM nearest_per_mission
    ORDER BY
      CASE WHEN mission_id = ANY($6::text[]) THEN 1 ELSE 0 END,
      random()
    LIMIT 1;
    `,
    [
      input.latitude,
      input.longitude,
      input.ageMin,
      input.ageMax,
      input.durationMinutes,
      input.excludeMissionIds ?? [],
      input.missionId ?? null,
    ],
  );

  return result.rows[0] ? mapLocationCandidate(result.rows[0]) : null;
}

/**
 * Searches for a home-based or location-agnostic activity candidate matching age and duration criteria.
 *
 * @param input - Fallback recommendation search criteria.
 * @returns A promise resolving to a matching `RecommendationCandidate`, or `null` if none found.
 */
export async function findFallbackRecommendation(
  input: FallbackRecommendationQuery,
): Promise<RecommendationCandidate | null> {
  const result = await pool.query(
    `
    SELECT
      mission_id,
      activity_title,
      description,
      equipment_needed,
      instruction_text,
      duration_minutes,
      mission_type,
      age_5_7,
      age_8_9,
      age_10_12,
      supervision_level
    FROM activity
    WHERE mission_type = ANY($5::text[])
      AND ($6::text IS NULL OR mission_id = $6)
      AND ($7::text IS NULL OR equipment_required_tag = $7)
      AND duration_minutes IS NOT NULL
      AND supervision_level IS NOT NULL
      AND duration_minutes <= $3
      AND (
        ($1 <= 7 AND $2 >= 5 AND age_5_7 = 'Y')
        OR ($1 <= 9 AND $2 >= 8 AND age_8_9 = 'Y')
        OR ($1 <= 12 AND $2 >= 10 AND age_10_12 = 'Y')
      )
    ORDER BY
      CASE WHEN mission_id = ANY($4::text[]) THEN 1 ELSE 0 END,
      random()
    LIMIT 1;
    `,
    [
      input.ageMin,
      input.ageMax,
      input.durationMinutes,
      input.excludeMissionIds ?? [],
      input.missionTypes,
      input.missionId ?? null,
      input.equipmentRequiredTag ?? null,
    ],
  );

  return result.rows[0] ? mapFallbackCandidate(result.rows[0]) : null;
}
