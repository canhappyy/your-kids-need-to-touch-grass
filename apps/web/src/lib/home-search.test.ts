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
      expect(calculateRangeFromBuckets(["5-6", "7-9", "10-12"])).toEqual([
        5, 12,
      ]);
      expect(calculateRangeFromBuckets([])).toEqual([7, 9]);
    });
  });

  describe("options", () => {
    it("generates 13 hour options from 0 to 12", () => {
      expect(hourOptions).toHaveLength(13);
      expect(hourOptions[0]).toEqual({ label: "0 hr", value: 0 });
      expect(hourOptions[12]).toEqual({ label: "12 hr", value: 12 });
    });

    it("generates 6 minute options from 15 to 90 minutes in 15-minute increments", () => {
      expect(minuteOptions).toHaveLength(6);
      expect(minuteOptions[0]).toEqual({ label: "15 min", value: 15 });
      expect(minuteOptions[1]).toEqual({ label: "30 min", value: 30 });
      expect(minuteOptions[2]).toEqual({ label: "45 min", value: 45 });
      expect(minuteOptions[3]).toEqual({ label: "60 min", value: 60 });
      expect(minuteOptions[4]).toEqual({ label: "75 min", value: 75 });
      expect(minuteOptions[5]).toEqual({ label: "90 min", value: 90 });
    });

    it("has valid default values", () => {
      expect(defaultHomeSearchValues).toEqual({
        ageRange: [7, 9],
        hours: 0,
        location: "",
        locationMode: "nearby",
        minutes: 45,
      });
    });
  });

  describe("validateSearchForm", () => {
    it("returns error when nearby location is empty", () => {
      const result = validateSearchForm({
        hours: 0,
        location: "",
        locationMode: "nearby",
        minutes: 30,
      });

      expect(result).toEqual({
        isValid: false,
        locationError: "Enter your postcode or suburb.",
        timeError: "",
      });
    });

    it("returns error when nearby numeric location is not a 4-digit postcode", () => {
      const resultShortDigits = validateSearchForm({
        hours: 0,
        location: "316",
        locationMode: "nearby",
        minutes: 30,
      });
      expect(resultShortDigits.locationError).toBe(
        "Enter a 4-digit postcode or suburb.",
      );

      const resultLongDigits = validateSearchForm({
        hours: 0,
        location: "12345",
        locationMode: "nearby",
        minutes: 30,
      });
      expect(resultLongDigits.locationError).toBe(
        "Enter a 4-digit postcode or suburb.",
      );
    });

    it("returns error when nearby location is too short", () => {
      const resultSingleChar = validateSearchForm({
        hours: 0,
        location: "a",
        locationMode: "nearby",
        minutes: 30,
      });
      expect(resultSingleChar.locationError).toBe(
        "Enter a valid postcode or suburb.",
      );
    });

    it("allows empty location when locationMode is home", () => {
      const result = validateSearchForm({
        hours: 0,
        location: "",
        locationMode: "home",
        minutes: 30,
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
        timeError: "Choose at least 15 minutes.",
      });
    });

    it("returns valid result for valid nearby inputs (postcodes and suburbs)", () => {
      const resultPostcode = validateSearchForm({
        hours: 0,
        location: "3168",
        locationMode: "nearby",
        minutes: 30,
      });

      expect(resultPostcode).toEqual({
        isValid: true,
        locationError: "",
        timeError: "",
      });

      const resultSuburb = validateSearchForm({
        hours: 0,
        location: "Clayton",
        locationMode: "nearby",
        minutes: 30,
      });

      expect(resultSuburb).toEqual({
        isValid: true,
        locationError: "",
        timeError: "",
      });

      const resultMultiWordSuburb = validateSearchForm({
        hours: 0,
        location: "St Kilda",
        locationMode: "nearby",
        minutes: 30,
      });

      expect(resultMultiWordSuburb).toEqual({
        isValid: true,
        locationError: "",
        timeError: "",
      });
    });
  });
});
