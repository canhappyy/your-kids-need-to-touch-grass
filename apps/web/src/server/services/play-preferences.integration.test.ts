import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pool from "@/lib/db";
import { getRecommendation } from "./recommendation.service";

const combinations = [
  { playStyle: "solo", canSupervise: false, tag: "Solo" },
  { playStyle: "solo", canSupervise: true, tag: "Solo" },
  { playStyle: "group", canSupervise: false, tag: "Group/Family" },
  { playStyle: "group", canSupervise: true, tag: "Group/Family" },
] as const;
const ids: string[] = [];

beforeAll(async () => {
  for (const missionType of [
    "Location-Based",
    "Home-Based",
    "Location-Agnostic",
  ]) {
    for (const [index, preference] of combinations.entries()) {
      const id = `TEST-PREFERENCES-${missionType}-${index}`;
      ids.push(id);
      await pool.query(
        `INSERT INTO activity (mission_id, activity_title, duration_minutes, age_5_7, age_8_9, age_10_12, equipment_required_tag, supervision_level, mission_type, social_tag)
         VALUES ($1, 'Preference fixture', 15, 'Y', 'Y', 'Y', 'None', $2, $3, $4)`,
        [
          id,
          preference.canSupervise
            ? "Needs Supervision"
            : "Independent-Play-Safe",
          missionType,
          preference.tag,
        ],
      );
      if (missionType === "Location-Based") {
        await pool.query(
          "INSERT INTO activity_location_category (mission_id, category_name) VALUES ($1, 'park')",
          [id],
        );
      }
    }
  }
});

afterAll(async () => {
  await pool.query("DELETE FROM activity WHERE mission_id = ANY($1::text[])", [
    ids,
  ]);
  await pool.end();
});

describe.each(["Location-Based", "Home-Based", "Location-Agnostic"])(
  "%s preferences",
  (missionType) => {
    it.each(combinations)(
      "matches $playStyle, supervision $canSupervise; rejects mismatched replay",
      async (preferences) => {
        const index = combinations.indexOf(preferences);
        const input = {
          locationMode:
            missionType === "Home-Based"
              ? ("home" as const)
              : ("nearby" as const),
          location: "Clayton 3168",
          ageMin: 6,
          ageMax: 10,
          // 90 minutes budget accommodates the 15m activity plus round-trip walking commute (~48m to the nearest 1.22km park)
          durationMinutes: 90,
          playStyle: preferences.playStyle,
          canSupervise: preferences.canSupervise,
          missionId: `TEST-PREFERENCES-${missionType}-${index}`,
        };
        // Nearby searches exercise both venue and location-agnostic fallback paths.
        const request =
          input.locationMode === "home"
            ? { ...input, locationMode: "home" as const, location: undefined }
            : { ...input, locationMode: "nearby" as const };
        expect(await getRecommendation(request)).toMatchObject({
          missionId: input.missionId,
        });
        expect(
          await getRecommendation({
            ...request,
            canSupervise: !input.canSupervise,
          }),
        ).toBeNull();
        expect(
          await getRecommendation({
            ...request,
            playStyle: input.playStyle === "solo" ? "group" : "solo",
          }),
        ).toBeNull();
        expect(
          await getRecommendation({
            ...request,
            missionId: undefined,
            durationMinutes: 0,
          }),
        ).toBeNull();
        const swapped = await getRecommendation({
          ...request,
          missionId: undefined,
          excludeMissionIds: [input.missionId],
        });
        expect(swapped).not.toBeNull();
        expect(swapped?.supervisionLevel).toBe(
          input.canSupervise ? "Needs Supervision" : "Independent-Play-Safe",
        );
        const actRes = await pool.query(
          "SELECT social_tag FROM activity WHERE mission_id = $1",
          [swapped?.missionId],
        );
        const allowed =
          input.playStyle === "solo"
            ? ["Solo", "social_agnostic"]
            : ["Group/Family", "social_agnostic"];
        expect(allowed.includes(actRes.rows[0]?.social_tag)).toBe(true);
      },
    );
  },
);

it("excludes missions with mismatched social_tag", async () => {
  const missionId = "TEST-PREFERENCES-Home-Based-0";
  await pool.query(
    "UPDATE activity SET social_tag = 'Group/Family' WHERE mission_id = $1",
    [missionId],
  );
  expect(
    await getRecommendation({
      locationMode: "home",
      ageMin: 6,
      ageMax: 10,
      durationMinutes: 30,
      playStyle: "solo",
      canSupervise: false,
      missionId,
    }),
  ).toBeNull();
});
