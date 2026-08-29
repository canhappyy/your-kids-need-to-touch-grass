import { afterAll, describe, expect, it } from "vitest"

import { GET } from "@/app/api/recommendations/route"
import pool from "@/lib/db"
import { resolveRecommendationLocation } from "@/server/services/location.service"
import { getRecommendation } from "@/server/services/recommendation.service"

const standardInput = {
  location: "Clayton 3168",
  ageMin: 6,
  ageMax: 10,
  durationMinutes: 120,
}

afterAll(async () => {
  await pool.end()
})

describe("seeded recommendation vertical slice", () => {
  it("returns one seeded recommendation within 3,000 ms", async () => {
    const startedAt = performance.now()
    const response = await GET(
      new Request(
        "http://localhost/api/recommendations?location=Clayton%203168&ageMin=6&ageMax=10&durationMinutes=120",
      ),
    )
    const elapsed = performance.now() - startedAt
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.recommendation).not.toBeNull()
    expect(Array.isArray(body.recommendation)).toBe(false)
    expect(elapsed).toBeLessThan(3_000)
  })

  it("gives a standalone postcode precedence over suburb text", async () => {
    const location = await resolveRecommendationLocation("Clayton 3000")

    expect(location.postcode).toBe("3000")
  })

  it("matches an exact suburb case-insensitively", async () => {
    const location = await resolveRecommendationLocation("cLaYtOn")

    expect(location.postcode).toBe("3168")
  })

  it("distinguishes unknown and ambiguous locations", async () => {
    await expect(resolveRecommendationLocation("Atlantis")).rejects.toMatchObject(
      { code: "LOCATION_NOT_FOUND", status: 404 },
    )
    await expect(resolveRecommendationLocation("Melbourne")).rejects.toMatchObject(
      { code: "AMBIGUOUS_LOCATION", status: 422 },
    )
  })

  it("selects a mission whose supported band overlaps the selected age", async () => {
    const recommendation = await getRecommendation({
      ...standardInput,
      ageMin: 7,
      ageMax: 7,
    })

    expect(recommendation).not.toBeNull()
    const result = await pool.query(
      "SELECT age_5_7 FROM activity WHERE mission_id = $1",
      [recommendation?.missionId],
    )
    expect(result.rows[0].age_5_7).toBe("Y")
  })

  it("returns a compatible venue within 10 km and filters duration", async () => {
    const recommendation = await getRecommendation(standardInput)

    expect(recommendation?.missionType).toBe("Location-Based")
    expect(recommendation?.durationMinutes).toBeLessThanOrEqual(120)
    expect(recommendation?.venue?.distanceKm).toBeLessThanOrEqual(10)

    const compatibility = await pool.query(
      `
      SELECT 1
      FROM activity_location_category
      WHERE mission_id = $1
        AND category_name = $2
      LIMIT 1
      `,
      [recommendation?.missionId, recommendation?.venue?.category],
    )
    expect(compatibility.rowCount).toBe(1)
  })

  it("uses Home-Based or Location-Agnostic fallback without location reason", async () => {
    const recommendation = await getRecommendation({
      ...standardInput,
      durationMinutes: 10,
    })

    expect(["Home-Based", "Location-Agnostic"]).toContain(
      recommendation?.missionType,
    )
    expect(recommendation?.venue).toBeNull()
    expect(recommendation?.reasons.map((reason) => reason.kind)).toEqual([
      "age",
      "time",
    ])
  })

  it("returns null when primary and fallback missions do not match", async () => {
    await expect(
      getRecommendation({ ...standardInput, durationMinutes: 5 }),
    ).resolves.toBeNull()
  })

  it("excludes the current mission when alternatives exist", async () => {
    const first = await getRecommendation(standardInput)
    const retry = await getRecommendation({
      ...standardInput,
      excludeMissionId: first?.missionId,
    })

    expect(first).not.toBeNull()
    expect(retry).not.toBeNull()
    expect(retry?.missionId).not.toBe(first?.missionId)
  })

  it("returns only age, time, and venue-derived location reasons", async () => {
    const recommendation = await getRecommendation(standardInput)

    expect(recommendation?.reasons).toEqual([
      { kind: "age", label: "Ages 6–10" },
      { kind: "time", label: "Fits within 2 hours" },
      {
        kind: "location",
        label: "Near Clayton, Notting Hill 3168",
      },
    ])
  })
})
