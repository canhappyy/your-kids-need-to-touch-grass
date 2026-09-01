import { describe, expect, it } from "vitest"

import {
  buildRecommendationApiUrl,
  buildSearchQuery,
  mapLocationErrorCode,
  parseRecommendationApiResponse,
  readSwapsUsed,
} from "./result-search"

describe("result-search lib utilities", () => {
  describe("readSwapsUsed", () => {
    it("returns 0 for null or non-number values", () => {
      expect(readSwapsUsed(null)).toBe(0)
      expect(readSwapsUsed("abc")).toBe(0)
      expect(readSwapsUsed("-1")).toBe(0)
    })

    it("returns parsed number when within valid range 0 to 2", () => {
      expect(readSwapsUsed("0")).toBe(0)
      expect(readSwapsUsed("1")).toBe(1)
      expect(readSwapsUsed("2")).toBe(2)
    })

    it("returns 0 when value exceeds MAX_SWAPS", () => {
      expect(readSwapsUsed("3")).toBe(0)
      expect(readSwapsUsed("10")).toBe(0)
    })
  })

  describe("buildSearchQuery", () => {
    it("builds search query for nearby mode including location", () => {
      const query = buildSearchQuery({
        ageMax: "10",
        ageMin: "6",
        hours: "1",
        location: "3000",
        locationMode: "nearby",
        minutes: "30",
      })

      expect(query.get("locationMode")).toBe("nearby")
      expect(query.get("location")).toBe("3000")
      expect(query.get("ageMin")).toBe("6")
      expect(query.get("ageMax")).toBe("10")
      expect(query.get("hours")).toBe("1")
      expect(query.get("minutes")).toBe("30")
    })

    it("omits location when locationMode is home", () => {
      const query = buildSearchQuery({
        ageMax: "10",
        ageMin: "6",
        hours: "2",
        location: "3000",
        locationMode: "home",
        minutes: "0",
      })

      expect(query.get("locationMode")).toBe("home")
      expect(query.get("location")).toBeNull()
    })
  })

  describe("mapLocationErrorCode", () => {
    it("maps known error codes", () => {
      expect(mapLocationErrorCode("LOCATION_NOT_FOUND")).toBe("not-found")
      expect(mapLocationErrorCode("AMBIGUOUS_LOCATION")).toBe("ambiguous")
      expect(mapLocationErrorCode("INVALID_INPUT")).toBe("invalid")
      expect(mapLocationErrorCode("UNKNOWN_CODE")).toBe("invalid")
    })
  })

  describe("buildRecommendationApiUrl", () => {
    it("computes durationMinutes and formats search query params", () => {
      const url = buildRecommendationApiUrl(
        {
          ageMax: "10",
          ageMin: "6",
          hours: "1",
          location: "3168",
          locationMode: "nearby",
          minutes: "15",
        },
        {
          excludeMissionIds: ["m1", "m2"],
          missionId: "m3",
        }
      )

      expect(url).toContain("/api/recommendations?")
      const parsedUrl = new URL(url, "http://localhost")
      expect(parsedUrl.searchParams.get("durationMinutes")).toBe("75")
      expect(parsedUrl.searchParams.get("location")).toBe("3168")
      expect(parsedUrl.searchParams.get("missionId")).toBe("m3")
      expect(parsedUrl.searchParams.getAll("excludeMissionId")).toEqual([
        "m1",
        "m2",
      ])
    })
  })

  describe("parseRecommendationApiResponse", () => {
    it("returns success for 200 response with recommendation", () => {
      const result = parseRecommendationApiResponse(200, {
        recommendation: {
          ageBands: ["5-7"],
          description: "Test description",
          durationMinutes: 30,
          equipmentNeeded: null,
          instructionText: null,
          missionId: "m1",
          missionType: "Home-Based",
          reasons: [],
          supervisionLevel: "Independent-Play-Safe",
          title: "Test Mission",
          venue: null,
        },
      })

      expect(result.type).toBe("success")
      if (result.type === "success") {
        expect(result.recommendation?.title).toBe("Test Mission")
      }
    })

    it("returns location_error for 400 location-related errors", () => {
      const result = parseRecommendationApiResponse(400, {
        error: { code: "LOCATION_NOT_FOUND", field: "location" },
      })

      expect(result).toEqual({
        type: "location_error",
        errorCode: "LOCATION_NOT_FOUND",
      })
    })

    it("returns generic error for 500 or unexpected errors", () => {
      const result = parseRecommendationApiResponse(500, {
        error: { code: "INTERNAL_ERROR" },
      })

      expect(result).toEqual({
        type: "error",
        message: "Recommendation request failed",
      })
    })
  })
})
