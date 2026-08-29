import pool from "@/lib/db";

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
