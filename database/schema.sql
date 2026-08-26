-- ============================================================
-- Nurturing Healthy Kids - Database Schema
-- ============================================================

-- 1. Lookup Tables

CREATE TABLE postcode (
    postcode  VARCHAR(10) PRIMARY KEY,
    latitude  DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    suburbs   text
);
-- One row per postcode, used to turn a users typed
-- postcode into a location.

CREATE TABLE location_category (
    category_name VARCHAR(50) PRIMARY KEY
);
INSERT INTO location_category ( category_name ) VALUES
    ( 'playground' ),
    ( 'wetland' ),
    ( 'bushland' ),
    ( 'nature' ),
    ( 'park' ),
    ( 'trail' ),
    ( 'active_sport' );
-- The 7 kinds of open space a location can be.

CREATE TABLE indoor_outdoor_tag (
    tag_name VARCHAR(50) PRIMARY KEY
);
INSERT INTO indoor_outdoor_tag ( tag_name ) VALUES
    ( 'Indoor' ),
    ( 'Outdoor' ),
    ( 'Either' );
-- Where an activity takes place.

CREATE TABLE equipment_required_tag (
    tag_name VARCHAR(100) PRIMARY KEY
);
INSERT INTO equipment_required_tag ( tag_name ) VALUES
    ( 'Household Items' ),
    ( 'Basic Sports Equipment' ),
    ( 'Specialised Equipment' );
-- Broad category of equipment an activity needs, for filtering.

CREATE TABLE supervision_level (
    level_name VARCHAR(50) PRIMARY KEY
);
INSERT INTO supervision_level ( level_name ) VALUES
    ( 'Independent-Play-Safe' ),
    ( 'Needs Supervision' );
-- Whether an adult needs to be present.

CREATE TABLE mission_type (
    type_name VARCHAR(50) PRIMARY KEY
);
INSERT INTO mission_type ( type_name ) VALUES
    ( 'Location-Based' ),
    ( 'Home-Based' ),
    ( 'Location-Agnostic' );
-- Whether an activity needs an open space, needs home/yard, or works anywhere.

CREATE TABLE weather_dependency (
    dependency_name VARCHAR(50) PRIMARY KEY
);
INSERT INTO weather_dependency ( dependency_name ) VALUES
    ( 'Weather-Independent' ),
    ( 'Outdoor-Fair-Weather-Only' ),
    ( 'Indoor-Fallback-Available' );
-- How sensitive an activity is to weather conditions.

CREATE TABLE variety_tag (
    tag_name VARCHAR(50) PRIMARY KEY
);
INSERT INTO variety_tag ( tag_name ) VALUES
    ( 'Energised Activity' ),
    ( 'Coordination' ),
    ( 'Imaginative Play' ),
    ( 'Creative' ),
    ( 'Construction' ),
    ( 'Nature' ),
    ( 'Exploration' ),
    ( 'Teamwork' ),
    ( 'Social' ),
    ( 'Quiet' ),
    ( 'Water Play' ),
    ( 'Throwing & Catching' ),
    ( 'Solo' ),
    ( 'Pairs' ),
    ( 'Group/Family' );
-- Descriptive play-style tags. An activity can have more than one.


-- 2. Core Entities

CREATE TABLE open_space (
    open_space_id INT PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    latitude      DECIMAL(9,6) NOT NULL,
    longitude     DECIMAL(9,6) NOT NULL,
    category      VARCHAR(50) NOT NULL,
    CONSTRAINT fk_open_space_category FOREIGN KEY ( category )
        REFERENCES location_category ( category_name )
);
-- A real, physical place a family can go to (park, trail, oval, etc).

CREATE TABLE activity (
    mission_id             VARCHAR(50) PRIMARY KEY,
    activity_title         VARCHAR(255) NOT NULL,
    description            text,
    equipment_needed       text,
    instruction_text       text,
    duration_minutes       INT,
    age_5_7                CHAR(1) DEFAULT 'N' CHECK ( age_5_7 IN ( 'Y',
                                                     'N' ) ),
    age_8_9                CHAR(1) DEFAULT 'N' CHECK ( age_8_9 IN ( 'Y',
                                                     'N' ) ),
    age_10_12              CHAR(1) DEFAULT 'N' CHECK ( age_10_12 IN ( 'Y',
                                                         'N' ) ),
    indoor_outdoor_tag     VARCHAR(50) NULL,
    equipment_required_tag VARCHAR(100) NULL,
    supervision_level      VARCHAR(50) NULL,
    mission_type           VARCHAR(50) NULL,
    weather_dependency     VARCHAR(50) NULL,
    CONSTRAINT fk_act_indoor_outdoor FOREIGN KEY ( indoor_outdoor_tag )
        REFERENCES indoor_outdoor_tag ( tag_name )
            ON DELETE SET NULL,
    CONSTRAINT fk_act_equipment FOREIGN KEY ( equipment_required_tag )
        REFERENCES equipment_required_tag ( tag_name )
            ON DELETE SET NULL,
    CONSTRAINT fk_act_supervision FOREIGN KEY ( supervision_level )
        REFERENCES supervision_level ( level_name )
            ON DELETE SET NULL,
    CONSTRAINT fk_act_mission_type FOREIGN KEY ( mission_type )
        REFERENCES mission_type ( type_name )
            ON DELETE SET NULL,
    CONSTRAINT fk_act_weather FOREIGN KEY ( weather_dependency )
        REFERENCES weather_dependency ( dependency_name )
            ON DELETE SET NULL
);
-- One row per activity variant (e.g. a 30-min and a 45-min version
-- of the same activity are two separate rows). Each activity is
-- tagged with the lookup values above; tags are optional (NULL
-- allowed) since not every activity fits every dimension.


-- 3. Junction Tables
-- Link activities to the location categories and variety tags they
-- support. A single activity can have several of each.

CREATE TABLE activity_location_category (
    mission_id        VARCHAR(50) NOT NULL,
    category_name     VARCHAR(50) NOT NULL,
    open_space_ref_id INT NULL,
    PRIMARY KEY ( mission_id,
                  category_name ),
    CONSTRAINT fk_alc_mission FOREIGN KEY ( mission_id )
        REFERENCES activity ( mission_id )
            ON DELETE CASCADE,
    CONSTRAINT fk_alc_category FOREIGN KEY ( category_name )
        REFERENCES location_category ( category_name )
            ON DELETE CASCADE,
    CONSTRAINT fk_alc_open_space FOREIGN KEY ( open_space_ref_id )
        REFERENCES open_space ( open_space_id )
            ON DELETE SET NULL
);
-- Which location categories (e.g. "park", "playground") an activity
-- works at. open_space_ref_id can optionally pin an activity to one
-- specific real place, instead of just a category.

CREATE TABLE activity_variety_tag (
    mission_id VARCHAR(50) NOT NULL,
    tag_name   VARCHAR(50) NOT NULL,
    PRIMARY KEY ( mission_id,
                  tag_name ),
    CONSTRAINT fk_avt_mission FOREIGN KEY ( mission_id )
        REFERENCES activity ( mission_id )
            ON DELETE CASCADE,
    CONSTRAINT fk_avt_tag FOREIGN KEY ( tag_name )
        REFERENCES variety_tag ( tag_name )
            ON DELETE CASCADE
);
-- Which variety tags (e.g. "Nature", "Teamwork") apply to an activity.