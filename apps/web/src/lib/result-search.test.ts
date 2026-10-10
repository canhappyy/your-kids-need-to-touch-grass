import { describe, expect, it } from "vitest"

import {
  buildRecommendationApiRequest,
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
  })

  describe("buildSearchQuery", () => {
    it("builds search query for nearby mode including location", () => {
      const query = buildSearchQuery({
        ageMax: "10",
        ageMin: "6",
        hours: "1",
        location: "3000",
        playStyle: "group",
        canSupervise: true,
        locationMode: "nearby",
        minutes: "30",
      })

      expect(query.get("locationMode")).toBe("nearby")
      expect(query.get("location")).toBe("3000")
      expect(query.get("playStyle")).toBe("group")
      expect(query.get("canSupervise")).toBe("true")
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
        playStyle: "solo",
        canSupervise: false,
        locationMode: "home",
        minutes: "0",
      })

      expect(query.get("locationMode")).toBe("home")
      expect(query.get("location")).toBeNull()
    })

    it("includes lat and lng when provided in nearby mode", () => {
      const query = buildSearchQuery({
        ageMax: "10",
        ageMin: "6",
        hours: "1",
        location: "3168",
        lat: "-37.915",
        lng: "145.123",
        playStyle: "solo",
        canSupervise: false,
        locationMode: "nearby",
        minutes: "30",
      })

      expect(query.get("lat")).toBe("-37.915")
      expect(query.get("lng")).toBe("145.123")
    })

    it("preserves an optional planner date", () => {
      const query = buildSearchQuery({
        ageMax: "10",
        ageMin: "6",
        hours: "1",
        location: "",
        playStyle: "group",
        canSupervise: true,
        locationMode: "home",
        minutes: "0",
        planDate: "2026-11-03",
      })

      expect(query.get("planDate")).toBe("2026-11-03")
    })

    it("omits child interests from navigation URLs", () => {
      const query = buildSearchQuery({
        ageMax: "10",
        ageMin: "6",
        hours: "1",
        interests: "dinosaurs and space",
        location: "",
        playStyle: "group",
        canSupervise: true,
        locationMode: "home",
        minutes: "0",
      })

      expect(query.get("interests")).toBeNull()
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

  describe("buildRecommendationApiRequest", () => {
    it("computes duration and keeps interests in the POST body", () => {
      const body = buildRecommendationApiRequest(
        {
          ageMax: "10",
          ageMin: "6",
          hours: "1",
          interests: "dinosaurs",
          location: "3168",
          lat: "-37.915",
          lng: "145.123",
          playStyle: "group",
          canSupervise: true,
          locationMode: "nearby",
          minutes: "15",
        },
        {
          excludeMissionIds: ["m1", "m2"],
        }
      )

      expect(body).toEqual({
        playStyle: "group",
        canSupervise: true,
        locationMode: "nearby",
        location: "3168",
        latitude: -37.915,
        longitude: 145.123,
        ageMin: 6,
        ageMax: 10,
        durationMinutes: 75,
        interests: "dinosaurs",
        excludeMissionIds: ["m1", "m2"],
      })
    })

    it("omits interests when replaying a shared mission", () => {
      const body = buildRecommendationApiRequest(
        {
          ageMax: "10",
          ageMin: "6",
          hours: "1",
          interests: "dinosaurs",
          location: "",
          playStyle: "solo",
          canSupervise: false,
          locationMode: "home",
          minutes: "0",
        },
        { missionId: "m3" },
      )

      expect(body.missionId).toBe("m3")
      expect(body.interests).toBeUndefined()
    })
  })

  describe("parseRecommendationApiResponse", () => {
    it("returns success for 200 response with recommendation", () => {
      const result = parseRecommendationApiResponse(200, {
        recommendation: {
          ageBands: ["5-7"],
          description: "Test description",
          durationMinutes: 30,
          commuteMinutes: 0,
          totalMinutes: 30,
          equipmentNeeded: null,
          instructionText: null,
          missionId: "m1",
          missionType: "Home-Based",
          reasons: [],
        supervisionLevel: "Independent-Play-Safe",
        varietyTags: [],
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
