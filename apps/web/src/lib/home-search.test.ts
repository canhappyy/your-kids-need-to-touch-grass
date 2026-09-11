import { describe, expect, it } from "vitest";

import {
  calculateRangeFromBuckets,
  defaultHomeSearchValues,
  getInitialBuckets,
  hourOptions,
  minuteOptions,
  validateSearchForm,
} from "./home-search";

describe("home-search lib utilities", () => {
  describe("age buckets", () => {
    it("derives initial buckets from range", () => {
      expect(getInitialBuckets([7, 9])).toEqual(["7-9"]);
      expect(getInitialBuckets([5, 6])).toEqual(["5-6"]);
      expect(getInitialBuckets([10, 12])).toEqual(["10-12"]);
      expect(getInitialBuckets([5, 9])).toEqual(["5-6", "7-9"]);
      expect(getInitialBuckets([7, 12])).toEqual(["7-9", "10-12"]);
      expect(getInitialBuckets([5, 12])).toEqual(["5-6", "7-9", "10-12"]);
    });

    it("calculates age range from selected bucket IDs", () => {
      expect(calculateRangeFromBuckets(["7-9"])).toEqual([7, 9]);
      expect(calculateRangeFromBuckets(["5-6", "7-9"])).toEqual([5, 9]);
      expect(calculateRangeFromBuckets(["7-9", "10-12"])).toEqual([7, 12]);
      expect(calculateRangeFromBuckets(["5-6", "10-12"])).toEqual([5, 12]);
      expect(calculateRangeFromBuckets(["5-6", "7-9", "10-12"])).toEqual([5, 12]);
      expect(calculateRangeFromBuckets([])).toEqual([7, 9]);
    });
  });

  describe("options", () => {
    it("generates 13 hour options from 0 to 12", () => {
      expect(hourOptions).toHaveLength(13);
      expect(hourOptions[0]).toEqual({ label: "0 hr", value: 0 });
      expect(hourOptions[12]).toEqual({ label: "12 hr", value: 12 });
    });

    it("generates 12 minute options in 5-minute increments", () => {
      expect(minuteOptions).toHaveLength(12);
      expect(minuteOptions[0]).toEqual({ label: "00 min", value: 0 });
      expect(minuteOptions[1]).toEqual({ label: "05 min", value: 5 });
      expect(minuteOptions[11]).toEqual({ label: "55 min", value: 55 });
    });

    it("has valid default values", () => {
      expect(defaultHomeSearchValues).toEqual({
        ageRange: [7, 9],
        hours: 2,
        location: "",
        locationMode: "nearby",
        minutes: 0,
      });
    });
  });

  describe("validateSearchForm", () => {
    it("returns error when nearby location is empty", () => {
      const result = validateSearchForm({
        hours: 1,
        location: "",
        locationMode: "nearby",
        minutes: 0,
      });

      expect(result).toEqual({
        isValid: false,
        locationError: "Enter your postcode.",
        timeError: "",
      });
    });

    it("returns error when nearby location is not a 4-digit postcode", () => {
      const resultNonDigits = validateSearchForm({
        hours: 1,
        location: "abcd",
        locationMode: "nearby",
        minutes: 0,
      });
      expect(resultNonDigits.locationError).toBe("Enter a 4-digit postcode.");

      const resultShortDigits = validateSearchForm({
        hours: 1,
        location: "316",
        locationMode: "nearby",
        minutes: 0,
      });
      expect(resultShortDigits.locationError).toBe("Enter a 4-digit postcode.");
    });

    it("allows empty location when locationMode is home", () => {
      const result = validateSearchForm({
        hours: 1,
        location: "",
        locationMode: "home",
        minutes: 0,
      });

      expect(result).toEqual({
        isValid: true,
        locationError: "",
        timeError: "",
      });
    });

    it("returns error when both hours and minutes are 0", () => {
      const result = validateSearchForm({
        hours: 0,
        location: "3000",
        locationMode: "nearby",
        minutes: 0,
      });

      expect(result).toEqual({
        isValid: false,
        locationError: "",
        timeError: "Choose at least 5 minutes.",
      });
    });

    it("returns valid result for valid nearby inputs", () => {
      const result = validateSearchForm({
        hours: 0,
        location: "3168",
        locationMode: "nearby",
        minutes: 30,
      });

      expect(result).toEqual({
        isValid: true,
        locationError: "",
        timeError: "",
      });
    });
  });
});
