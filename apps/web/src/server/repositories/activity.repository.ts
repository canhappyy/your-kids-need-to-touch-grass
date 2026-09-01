import pool from "@/lib/db";

/**
 * Retrieves all activities from the database ordered alphabetically by title.
 *
 * @returns A promise resolving to an array of raw activity records.
 */
export async function findAllActivities() {
  const result = await pool.query(`
    SELECT
      mission_id,
      activity_title,
      description,
      equipment_needed,
      instruction_text,
      duration_minutes,
      age_5_7,
      age_8_9,
      age_10_12,
      indoor_outdoor_tag,
      equipment_required_tag,
      supervision_level,
      mission_type,
      weather_dependency
    FROM activity
    ORDER BY activity_title;
  `);

  return result.rows;
}

/**
 * Retrieves a single activity by its unique mission identifier,
 * including aggregated location categories and variety tags.
 *
 * @param missionId - The unique ID of the mission to find.
 * @returns A promise resolving to the activity record with aggregated tags, or `null` if not found.
 */
export async function findActivityById(missionId: string) {
  const result = await pool.query(
    `
    SELECT
      a.mission_id,
      a.activity_title,
      a.description,
      a.equipment_needed,
      a.instruction_text,
      a.duration_minutes,
      a.age_5_7,
      a.age_8_9,
      a.age_10_12,
      a.indoor_outdoor_tag,
      a.equipment_required_tag,
      a.supervision_level,
      a.mission_type,
      a.weather_dependency,

      COALESCE(
        ARRAY_AGG(DISTINCT alc.category_name)
        FILTER (WHERE alc.category_name IS NOT NULL),
        '{}'
      ) AS location_categories,

      COALESCE(
        ARRAY_AGG(DISTINCT avt.tag_name)
        FILTER (WHERE avt.tag_name IS NOT NULL),
        '{}'
      ) AS variety_tags

    FROM activity a

    LEFT JOIN activity_location_category alc
      ON alc.mission_id = a.mission_id

    LEFT JOIN activity_variety_tag avt
      ON avt.mission_id = a.mission_id

    WHERE a.mission_id = $1

    GROUP BY a.mission_id;
    `,
    [missionId],
  );

  return result.rows[0] ?? null;
}
