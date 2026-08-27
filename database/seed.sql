-- ============================================================
-- Nurturing Healthy Kids - Seed Data
-- ============================================================

BEGIN;

-- 1. POSTCODE
\copy postcode (postcode, latitude, longitude, suburbs) FROM 'postcode_location_db.csv' WITH (FORMAT csv, HEADER true, NULL '')


-- 2. OPEN_SPACE
\copy open_space (open_space_id, name, latitude, longitude, category) FROM 'open_space_location_db.csv' WITH (FORMAT csv, HEADER true, NULL '')


-- 3. ACTIVITY + ACTIVITY_VARIETY_TAG
-- activities_db.csv has one extra column (variety_tags, e.g. "Nature|Exploration")
-- that isn't a column on activity, it's the activity_variety_tag
-- junction table. A staging table holds the raw row so it can be split:
-- one insert goes to activity (without variety_tags), a second insert
-- splits variety_tags on "|" into one row per tag.
CREATE TEMP TABLE staging_activity (
    mission_id              VARCHAR(50),
    activity_title          VARCHAR(255),
    description             TEXT,
    equipment_needed        TEXT,
    instruction_text        TEXT,
    indoor_outdoor_tag      VARCHAR(50),
    duration_minutes        INT,
    age_5_7                 CHAR(1),
    age_8_9                 CHAR(1),
    age_10_12               CHAR(1),
    equipment_required_tag  VARCHAR(100),
    supervision_level       VARCHAR(50),
    mission_type            VARCHAR(50),
    weather_dependency      VARCHAR(50),
    variety_tags            TEXT
);
\copy staging_activity FROM 'activities_db.csv' WITH (FORMAT csv, HEADER true, NULL '')

INSERT INTO activity (
    mission_id, activity_title, description, equipment_needed, instruction_text,
    duration_minutes, age_5_7, age_8_9, age_10_12,
    indoor_outdoor_tag, equipment_required_tag, supervision_level, mission_type, weather_dependency
)
SELECT
    mission_id, activity_title, description, equipment_needed, instruction_text,
    duration_minutes, age_5_7, age_8_9, age_10_12,
    indoor_outdoor_tag, equipment_required_tag, supervision_level, mission_type, weather_dependency
FROM staging_activity;

INSERT INTO activity_variety_tag (mission_id, tag_name)
SELECT mission_id, unnest(string_to_array(variety_tags, '|'))
FROM staging_activity
WHERE variety_tags IS NOT NULL;

DROP TABLE staging_activity;


-- 4. ACTIVITY_LOCATION_CATEGORY
\copy activity_location_category (mission_id, category_name) FROM 'Activity_LocationCategory.csv' WITH (FORMAT csv, HEADER true, NULL '')

COMMIT;