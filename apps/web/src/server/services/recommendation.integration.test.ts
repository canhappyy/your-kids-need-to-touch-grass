import { afterAll, describe, expect, it } from "vitest"

import { GET } from "@/app/api/recommendations/route"
import pool from "@/lib/db"
import { findNearestPostcodeLocation } from "@/server/repositories/postcode.repository"
import { resolveRecommendationLocation } from "@/server/services/location.service"
import { getRecommendation } from "@/server/services/recommendation.service"

const input = {
  locationMode: "nearby" as const,
  location: "Clayton 3168",
  ageMin: 6,
  ageMax: 10,
  durationMinutes: 120,
}

afterAll(() => pool.end())

describe("seeded recommendation flow", () => {
  it("returns exactly one recommendation within 3,000 ms", async () => {
    const startedAt = performance.now()
    const response = await GET(
      new Request(
        "http://localhost/api/recommendations?location=Clayton%203168&ageMin=6&ageMax=10&durationMinutes=120",
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.recommendation).not.toBeNull()
    expect(Array.isArray(body.recommendation)).toBe(false)
    expect(performance.now() - startedAt).toBeLessThan(3_000)
  })

  it("resolves postcode precedence, exact suburbs, and location errors", async () => {
    await expect(resolveRecommendationLocation("Clayton 3000")).resolves.toMatchObject({
      postcode: "3000",
    })
    await expect(resolveRecommendationLocation("cLaYtOn")).resolves.toMatchObject({
      postcode: "3168",
    })
    await expect(resolveRecommendationLocation("316")).rejects.toMatchObject({
      code: "INVALID_INPUT",
      status: 400,
    })
    await expect(resolveRecommendationLocation("Atlantis")).rejects.toMatchObject({
      code: "LOCATION_NOT_FOUND",
      status: 404,
    })
    await expect(resolveRecommendationLocation("1111")).rejects.toMatchObject({
      code: "LOCATION_NOT_FOUND",
      status: 404,
    })
    await expect(resolveRecommendationLocation("Melbourne")).rejects.toMatchObject({
      code: "AMBIGUOUS_LOCATION",
      status: 422,
    })
  })

  it("resolves GPS coordinates only within postcode dataset coverage", async () => {
    await expect(
      findNearestPostcodeLocation(-37.91342, 145.12665, 50),
    ).resolves.toMatchObject({ postcode: "3168" })
    await expect(findNearestPostcodeLocation(0, 0, 50)).resolves.toBeNull()
  })

  it("matches age, duration, compatible venue, distance, and reasons", async () => {
    const recommendation = await getRecommendation({
      ...input,
      ageMin: 7,
      ageMax: 7,
    })

    expect(recommendation).toMatchObject({
      missionType: "Location-Based",
      reasons: [
        { kind: "age", label: "Ages 7-7" },
        { kind: "time", label: "Fits within 2 hours" },
        { kind: "location", label: "Near Clayton, Notting Hill 3168" },
      ],
    })
    expect(recommendation?.durationMinutes).toBeLessThanOrEqual(120)
    expect(recommendation?.venue?.distanceKm).toBeLessThanOrEqual(10)

    const match = await pool.query(
      `
      SELECT
        a.age_5_7,
        EXISTS (
          SELECT 1
          FROM activity_location_category AS alc
          WHERE alc.mission_id = a.mission_id
            AND alc.category_name = $2
        ) AS compatible
      FROM activity AS a
      WHERE a.mission_id = $1
      `,
      [recommendation?.missionId, recommendation?.venue?.category],
    )
    expect(match.rows[0]).toMatchObject({ age_5_7: "Y", compatible: true })
  })

  it("uses fallback, then returns null when no tier fits", async () => {
    const fallback = await getRecommendation({ ...input, durationMinutes: 10 })

    expect(["Home-Based", "Location-Agnostic"]).toContain(fallback?.missionType)
    expect(fallback?.venue).toBeNull()
    expect(fallback?.reasons.map((reason) => reason.kind)).toEqual([
      "age",
      "time",
    ])
    await expect(
      getRecommendation({ ...input, durationMinutes: 5 }),
    ).resolves.toBeNull()
  })

  it("prefers missions outside the shown list and repeats after exhaustion", async () => {
    const first = await getRecommendation(input)
    const retry = await getRecommendation({
      ...input,
      excludeMissionIds: first ? [first.missionId] : [],
    })

    expect(retry?.missionId).not.toBe(first?.missionId)

    const eligible = await pool.query<{ mission_id: string }>(
      `
      SELECT mission_id
      FROM activity
      WHERE duration_minutes <= $1
        AND (
          ($2 <= 7 AND $3 >= 5 AND age_5_7 = 'Y')
          OR ($2 <= 9 AND $3 >= 8 AND age_8_9 = 'Y')
          OR ($2 <= 12 AND $3 >= 10 AND age_10_12 = 'Y')
        )
      `,
      [input.durationMinutes, input.ageMin, input.ageMax],
    )
    const repeat = await getRecommendation({
      ...input,
      excludeMissionIds: eligible.rows.map((row) => row.mission_id),
    })

    expect(repeat).not.toBeNull()
  })

  it("replays the same Home-Based mission for a home search", async () => {
    const homeInput = {
      locationMode: "home" as const,
      ageMin: 6,
      ageMax: 10,
      durationMinutes: 120,
    }
    const first = await getRecommendation(homeInput)
    const replay = await getRecommendation({
      ...homeInput,
      missionId: first?.missionId,
    })

    expect(first?.missionType).toBe("Home-Based")
    expect(replay).toMatchObject({
      missionId: first?.missionId,
      missionType: "Home-Based",
    })
  })

  it("excludes equipment-required missions from home searches", async () => {
    await expect(
      getRecommendation({
        locationMode: "home",
        ageMin: 6,
        ageMax: 10,
        durationMinutes: 120,
        missionId: "MIS-025",
      }),
    ).resolves.toBeNull()
  })

  it("excludes a mission without a duration", async () => {
    const missionId = "TEST-US13-NULL-DURATION"

    await pool.query("DELETE FROM activity WHERE mission_id = $1", [missionId])

    try {
      await pool.query(
        `
        INSERT INTO activity (
          mission_id,
          activity_title,
          duration_minutes,
          age_5_7,
          age_8_9,
          age_10_12,
          mission_type
        )
        VALUES ($1, 'Missing Duration Mission', NULL, 'Y', 'Y', 'Y', 'Home-Based')
        `,
        [missionId],
      )

      await expect(
        getRecommendation({
          locationMode: "home",
          ageMin: 6,
          ageMax: 10,
          durationMinutes: 120,
          missionId,
        }),
      ).resolves.toBeNull()
    } finally {
      await pool.query("DELETE FROM activity WHERE mission_id = $1", [missionId])
    }
  })
})
