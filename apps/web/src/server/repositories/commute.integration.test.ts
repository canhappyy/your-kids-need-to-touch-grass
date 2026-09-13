import { afterAll, beforeAll, describe, expect, it } from "vitest";

import pool from "@/lib/db";
import { findLocationBasedRecommendation } from "./recommendation.repository";

const missionId = "TEST-US21-RETURN-WALK";
const openSpaceId = -21001;

beforeAll(async () => {
  await pool.query(
    `INSERT INTO open_space (open_space_id, name, latitude, longitude, category)
     VALUES ($1, 'Return Walk Test Park', 0, 0, 'park')`,
    [openSpaceId],
  );
  await pool.query(
    `INSERT INTO activity (mission_id, activity_title, duration_minutes,
       age_5_7, age_8_9, age_10_12, supervision_level, mission_type, social_tag)
     VALUES ($1, 'Return Walk Mission', 20, 'Y', 'Y', 'N',
       'Independent-Play-Safe', 'Location-Based', 'Solo')`,
    [missionId],
  );
  await pool.query(
    `INSERT INTO activity_location_category (mission_id, category_name, open_space_ref_id)
     VALUES ($1, 'park', $2)`,
    [missionId, openSpaceId],
  );
  await pool.query(
    "INSERT INTO activity_variety_tag (mission_id, tag_name) VALUES ($1, 'Solo')",
    [missionId],
  );
});

afterAll(async () => {
  await pool.query("DELETE FROM activity WHERE mission_id = $1", [missionId]);
  await pool.query("DELETE FROM open_space WHERE open_space_id = $1", [
    openSpaceId,
  ]);
  await pool.end();
});

describe("round-trip walking budget", () => {
  it.each([
    { latitude: 0, budget: 20, commute: 0, fits: true },
    // About 0.500 km: 10 minutes each way, plus 20 minutes activity.
    { latitude: 0.00449, budget: 40, commute: 20, fits: true },
    { latitude: 0.00449, budget: 39, commute: 20, fits: false },
    // About 0.514 km: displayed as 0.51, but needs 11 minutes each way.
    { latitude: 0.00462, budget: 42, commute: 22, fits: true },
    { latitude: 0.00462, budget: 41, commute: 22, fits: false },
  ])(
    "latitude $latitude, budget $budget: fits $fits",
    async ({ latitude, budget, commute, fits }) => {
      await pool.query(
        "UPDATE open_space SET latitude = $1 WHERE open_space_id = $2",
        [latitude, openSpaceId],
      );
      const result = await findLocationBasedRecommendation({
        latitude: 0,
        longitude: 0,
        ageMin: 6,
        ageMax: 10,
        durationMinutes: budget,
        playStyle: "solo",
        canSupervise: false,
        missionId,
      });

      if (!fits) {
        expect(result).toBeNull();
        return;
      }
      expect(result).toMatchObject({
        missionId,
        durationMinutes: 20,
        commuteMinutes: commute,
        totalMinutes: 20 + commute,
      });
    },
  );
});
