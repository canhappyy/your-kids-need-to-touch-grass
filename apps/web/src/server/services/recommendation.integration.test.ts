import { afterAll, describe, expect, it } from "vitest"

import { GET } from "@/app/api/recommendations/route"
import pool from "@/lib/db"
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
    await expect(resolveRecommendationLocation("Melbourne")).rejects.toMatchObject({
      code: "AMBIGUOUS_LOCATION",
      status: 422,
    })
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

  it("excludes the current mission when an alternative exists", async () => {
    const first = await getRecommendation(input)
    const retry = await getRecommendation({
      ...input,
      excludeMissionId: first?.missionId,
    })

    expect(retry?.missionId).not.toBe(first?.missionId)
  })
})
