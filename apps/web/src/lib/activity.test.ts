import { describe, expect, it } from "vitest"

import {
  calculateDailyGoalProgress,
  formatDuration,
  formatSupervision,
  getDirectionsUrl,
  getLocationLabel,
} from "./activity"

describe("activity lib utilities", () => {
  describe("formatDuration", () => {
    it("formats minutes only when under an hour", () => {
      expect(formatDuration(15)).toBe("15 minutes")
      expect(formatDuration(45)).toBe("45 minutes")
    })

    it("formats exactly one hour", () => {
      expect(formatDuration(60)).toBe("1 hour")
    })

    it("formats multiple hours exactly", () => {
      expect(formatDuration(120)).toBe("2 hours")
      expect(formatDuration(180)).toBe("3 hours")
    })

    it("formats hours and minutes combination", () => {
      expect(formatDuration(75)).toBe("1 hour 15 minutes")
      expect(formatDuration(150)).toBe("2 hours 30 minutes")
    })
  })

  describe("formatSupervision", () => {
    it("formats Independent-Play-Safe string correctly", () => {
      expect(formatSupervision("Independent-Play-Safe")).toBe("Independent play")
    })

    it("formats Needs Supervision string correctly", () => {
      expect(formatSupervision("Needs Supervision")).toBe("Adult supervision")
    })

    it("accepts an object with supervisionLevel property", () => {
      expect(
        formatSupervision({ supervisionLevel: "Independent-Play-Safe" })
      ).toBe("Independent play")
      expect(
        formatSupervision({ supervisionLevel: "Needs Supervision" })
      ).toBe("Adult supervision")
    })
  })

  describe("getLocationLabel", () => {
    it("returns venue name when venue is present", () => {
      const label = getLocationLabel({
        venue: {
          category: "Park",
          distanceKm: 1.2,
          latitude: -37.8136,
          longitude: 144.9631,
          name: "Central Park",
          openSpaceId: 101,
        },
        missionType: "Location-Based",
      })
      expect(label).toBe("Central Park")
    })

    it("returns 'At home' for Home-Based missions with no venue", () => {
      const label = getLocationLabel({
        venue: null,
        missionType: "Home-Based",
      })
      expect(label).toBe("At home")
    })

    it("returns 'Anywhere' for non-Home-Based missions with no venue", () => {
      const label = getLocationLabel({
        venue: null,
        missionType: "Location-Agnostic",
      })
      expect(label).toBe("Anywhere")
    })
  })

  describe("getDirectionsUrl", () => {
    it("returns null when venue is null", () => {
      expect(getDirectionsUrl(null)).toBeNull()
    })

    it("returns encoded Google Maps URL when venue is provided", () => {
      const venue = {
        category: "Playground",
        distanceKm: 0.8,
        latitude: -37.9,
        longitude: 145.1,
        name: "Community Reserve",
        openSpaceId: 202,
      }
      expect(getDirectionsUrl(venue)).toBe(
        "https://www.google.com/maps/search/?api=1&query=-37.9%2C145.1"
      )
    })
  })

  describe("calculateDailyGoalProgress", () => {
    it("calculates progress percentage and labels correctly", () => {
      const result30 = calculateDailyGoalProgress(30, 60)
      expect(result30).toEqual({
        dailyGoalPercentage: 50,
        progressValue: 50,
        label: "50% of the 60-minute daily goal",
      })

      const result60 = calculateDailyGoalProgress(60, 60)
      expect(result60).toEqual({
        dailyGoalPercentage: 100,
        progressValue: 100,
        label: "100% of the 60-minute daily goal",
      })
    })

    it("clamps progressValue to 100 while allowing dailyGoalPercentage to exceed 100", () => {
      const result90 = calculateDailyGoalProgress(90, 60)
      expect(result90).toEqual({
        dailyGoalPercentage: 150,
        progressValue: 100,
        label: "150% of the 60-minute daily goal",
      })
    })
  })
})
