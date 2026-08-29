import pool from "@/lib/db";
import type {
  MissionType,
  RecommendationVenue,
} from "@/types/recommendation";

export type RecommendationCandidate = {
  missionId: string;
  title: string;
  description: string | null;
  equipmentNeeded: string | null;
  instructionText: string | null;
  durationMinutes: number;
  missionType: MissionType;
  venue: RecommendationVenue | null;
};

export type RecommendationQuery = {
  latitude: number;
  longitude: number;
  ageMin: number;
  ageMax: number;
  durationMinutes: number;
  excludeMissionId?: string;
};

export type FallbackRecommendationQuery = Omit<
  RecommendationQuery,
  "latitude" | "longitude"
>;

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
    venue: null,
  };
}

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
      CASE WHEN mission_id = $6 THEN 1 ELSE 0 END,
      random()
    LIMIT 1;
    `,
    [
      input.latitude,
      input.longitude,
      input.ageMin,
      input.ageMax,
      input.durationMinutes,
      input.excludeMissionId ?? null,
    ],
  );

  return result.rows[0] ? mapLocationCandidate(result.rows[0]) : null;
}

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
      mission_type
    FROM activity
    WHERE mission_type IN ('Home-Based', 'Location-Agnostic')
      AND duration_minutes <= $3
      AND (
        ($1 <= 7 AND $2 >= 5 AND age_5_7 = 'Y')
        OR ($1 <= 9 AND $2 >= 8 AND age_8_9 = 'Y')
        OR ($1 <= 12 AND $2 >= 10 AND age_10_12 = 'Y')
      )
    ORDER BY
      CASE WHEN mission_id = $4 THEN 1 ELSE 0 END,
      random()
    LIMIT 1;
    `,
    [
      input.ageMin,
      input.ageMax,
      input.durationMinutes,
      input.excludeMissionId ?? null,
    ],
  );

  return result.rows[0] ? mapFallbackCandidate(result.rows[0]) : null;
}
