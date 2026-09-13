import pool from "@/lib/db";

/**
 * Retrieves all activities from the database ordered alphabetically by title.
 *
 * How this query works:
 * 1. Core Activity Info (`SELECT ... FROM activity`):
 *    Reads all primary activity fields (title, description, equipment, duration,
 *    age suitability, weather dependency, supervision level, etc.) directly from the `activity` table.
 *    *(Note: Does not perform joins with location categories or variety tags to keep catalog listing lightweight).*
 *
 * 2. Alphabetical Sorting (`ORDER BY activity_title`):
 *    Sorts all records in ascending order (A to Z) by `activity_title`
 *    for consistent and predictable display in lists or directory views.
 *
 * 3. Result Format (`return result.rows`):
 *    Returns the complete list of matching database rows as an array,
 *    or an empty array `[]` if no activities exist.
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
 * Fetches the full details of a specific activity by its mission ID,
 * including all associated location categories and variety tags.
 *
 * How this query works:
 * 1. Core Activity Info (`SELECT ... FROM activity a`):
 *    Retrieves all primary activity fields (title, description, equipment, duration,
 *    age suitability, weather dependency, supervision level, etc.).
 *
 * 2. Connecting Related Tables (`LEFT JOIN`):
 *    An activity can have multiple location categories (`activity_location_category`)
 *    and variety tags (`activity_variety_tag`). We use `LEFT JOIN` so that an activity is
 *    still returned even if it has no categories or tags assigned yet.
 *
 * 3. Combining Related Rows into Lists (`ARRAY_AGG(DISTINCT ...)`):
 *    Normally, SQL joins produce multiple duplicate rows when there are multiple tags.
 *    `ARRAY_AGG` bundles matching tag names into a PostgreSQL array (`text[]`) within a single row:
 *    - `DISTINCT` eliminates duplicate entries.
 *    - `FILTER (WHERE ... IS NOT NULL)` prevents `NULL` entries from joining empty relationships.
 *
 * 4. Handling Empty Arrays (`COALESCE(..., '{}')`):
 *    If an activity has zero tags or categories, `COALESCE` defaults to an empty array (`{}`)
 *    instead of returning `null`.
 *
 * 5. Safe Filtering & Grouping (`WHERE ... GROUP BY`):
 *    - Uses parameterized `$1` (`[missionId]`) to prevent SQL injection.
 *    - `GROUP BY a.mission_id` groups the joined records into one single object per activity.
 *
 * @param missionId - The unique identifier of the activity/mission to retrieve.
 * @returns A promise resolving to the activity record with `location_categories` and `variety_tags` string arrays, or `null` if not found.
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
      a.social_tag,

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
