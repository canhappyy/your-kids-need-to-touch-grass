import { describe, expect, it } from "vitest";

import {
  IMPORTANT_DATE_SOURCES,
  getImportantDatesForDate,
} from "./victorian-important-dates";

describe("Victorian important dates", () => {
  it("finds vetted public holidays", () => {
    expect(getImportantDatesForDate("2026-03-09")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Labour Day", kind: "public-holiday" }),
      ]),
    );
    expect(getImportantDatesForDate("2027-11-02")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Melbourne Cup Day",
          kind: "public-holiday",
        }),
      ]),
    );
  });

  it("expands inclusive Victorian school holiday ranges", () => {
    expect(getImportantDatesForDate("2027-07-03")).toEqual([
      expect.objectContaining({
        name: "Victorian school holidays",
        kind: "school-holiday",
      }),
    ]);
    expect(getImportantDatesForDate("2027-07-12")).toEqual([]);
  });

  it("returns every event when public and school holidays overlap", () => {
    const names = getImportantDatesForDate("2027-01-01").map(
      (date) => date.name,
    );
    expect(names).toEqual(["New Year's Day", "Victorian school holidays"]);
  });

  it("keeps official source attribution with the bundled snapshot", () => {
    expect(IMPORTANT_DATE_SOURCES).toEqual([
      expect.objectContaining({
        url: "https://business.vic.gov.au/business-information/public-holidays/victorian-public-holidays-2026",
      }),
      expect.objectContaining({
        url: "https://www.vic.gov.au/school-term-dates-and-holidays-victoria",
      }),
    ]);
  });
});
