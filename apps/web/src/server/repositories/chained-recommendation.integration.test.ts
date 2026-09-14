import { afterAll, beforeAll, describe, expect, it } from "vitest";

import pool from "@/lib/db";
import { findChainedRecommendation } from "./recommendation.repository";

const venueIds = [-34001, -34002];
const missionIds = [
  "TEST-US34-PRIMARY",
  "TEST-US34-SHORTEST",
  "TEST-US34-LONGER",
  "TEST-US34-WRONG-VENUE",
  "TEST-US34-WRONG-PREFS",
];

beforeAll(async () => {
  await pool.query("DELETE FROM activity WHERE mission_id = ANY($1::text[])", [
    missionIds,
  ]);
  await pool.query(
    "DELETE FROM open_space WHERE open_space_id = ANY($1::int[])",
    [venueIds],
  );
  await pool.query(
    `
    INSERT INTO open_space (open_space_id, name, latitude, longitude, category)
    VALUES
      ($1, 'Chain Test Park', -37.920, 145.120, 'park'),
      ($2, 'Other Chain Park', -37.921, 145.121, 'park')
    `,
    venueIds,
  );
  await pool.query(
    `
    INSERT INTO activity (
      mission_id, activity_title, duration_minutes,
      age_5_7, age_8_9, age_10_12,
      supervision_level, mission_type, social_tag
    )
    VALUES
      ($1, 'Primary Mission', 20, 'Y', 'Y', 'N',
        'Independent-Play-Safe', 'Location-Based', 'Solo'),
      ($2, 'Shortest Match', 40, 'Y', 'Y', 'N',
        'Independent-Play-Safe', 'Location-Based', 'Solo'),
      ($3, 'Longer Match', 45, 'Y', 'Y', 'N',
        'Independent-Play-Safe', 'Location-Based', 'Solo'),
      ($4, 'Wrong Venue', 40, 'Y', 'Y', 'N',
        'Independent-Play-Safe', 'Location-Based', 'Solo'),
      ($5, 'Wrong Preferences', 40, 'N', 'N', 'Y',
        'Needs Supervision', 'Location-Based', 'Group/Family')
    `,
    missionIds,
  );
  await pool.query(
    `
    INSERT INTO activity_location_category (
      mission_id, category_name, open_space_ref_id
    )
    VALUES
      ($1, 'park', NULL),
      ($2, 'park', NULL),
      ($3, 'park', $6),
      ($4, 'park', $7),
      ($5, 'park', NULL)
    `,
    [...missionIds, venueIds[0], venueIds[1]],
  );
});

afterAll(async () => {
  await pool.query("DELETE FROM activity WHERE mission_id = ANY($1::text[])", [
    missionIds,
  ]);
  await pool.query(
    "DELETE FROM open_space WHERE open_space_id = ANY($1::int[])",
    [venueIds],
  );
  await pool.end();
});

const input = {
  primaryMissionId: missionIds[0],
  openSpaceId: venueIds[0],
  latitude: -37.920,
  longitude: 145.120,
  ageMin: 6,
  ageMax: 9,
  playStyle: "solo" as const,
  canSupervise: false,
};

describe("findChainedRecommendation", () => {
  it("chooses the shortest distinct mission that reaches 60 minutes at the exact venue", async () => {
    await expect(findChainedRecommendation(input)).resolves.toMatchObject({
      recommendation: {
        missionId: missionIds[1],
        durationMinutes: 40,
        commuteMinutes: 0,
        totalMinutes: 40,
        venue: { openSpaceId: venueIds[0], name: "Chain Test Park" },
      },
      outingTotalMinutes: 60,
    });
  });

  it("replays only an eligible secondary mission", async () => {
    await expect(
      findChainedRecommendation({ ...input, missionId: missionIds[2] }),
    ).resolves.toMatchObject({
      recommendation: { missionId: missionIds[2] },
      outingTotalMinutes: 65,
    });

    await expect(
      findChainedRecommendation({ ...input, missionId: missionIds[3] }),
    ).resolves.toBeNull();
    await expect(
      findChainedRecommendation({ ...input, missionId: missionIds[4] }),
    ).resolves.toBeNull();
    await expect(
      findChainedRecommendation({ ...input, missionId: missionIds[0] }),
    ).resolves.toBeNull();
  });

  it("returns null when the primary mission is already 60 minutes", async () => {
    await pool.query(
      "UPDATE activity SET duration_minutes = 60 WHERE mission_id = $1",
      [missionIds[0]],
    );

    await expect(findChainedRecommendation(input)).resolves.toBeNull();

    await pool.query(
      "UPDATE activity SET duration_minutes = 20 WHERE mission_id = $1",
      [missionIds[0]],
    );
  });
});
