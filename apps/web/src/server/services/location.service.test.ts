import { describe, expect, it, vi } from "vitest";

import {
  LocationResolutionError,
  resolveRecommendationLocation,
  type LocationRepository,
} from "@/server/services/location.service";

const clayton = {
  postcode: "3168",
  latitude: -37.925,
  longitude: 145.119,
  suburbs: "Clayton, Notting Hill",
};

function repository(overrides: Partial<LocationRepository> = {}): LocationRepository {
  return {
    findByPostcode: vi.fn().mockResolvedValue(clayton),
    findBySuburb: vi.fn().mockResolvedValue([clayton]),
    ...overrides,
  };
}

describe("resolveRecommendationLocation", () => {
  it("uses a standalone postcode before suburb text", async () => {
    const repo = repository();

    const result = await resolveRecommendationLocation("  Somewhere 3168  ", repo);

    expect(repo.findByPostcode).toHaveBeenCalledWith("3168");
    expect(repo.findBySuburb).not.toHaveBeenCalled();
    expect(result).toEqual({
      ...clayton,
      label: "Clayton, Notting Hill 3168",
    });
  });

  it("resolves an exact case-insensitive suburb", async () => {
    const repo = repository();

    await resolveRecommendationLocation("cLaYtOn", repo);

    expect(repo.findBySuburb).toHaveBeenCalledWith("cLaYtOn");
    expect(repo.findByPostcode).not.toHaveBeenCalled();
  });

  it("rejects numeric-only locations that are not four digits", async () => {
    const repo = repository();

    await expect(resolveRecommendationLocation("316", repo)).rejects.toMatchObject({
      code: "INVALID_INPUT",
      status: 400,
    });
    expect(repo.findByPostcode).not.toHaveBeenCalled();
  });

  it("reports unknown locations", async () => {
    const repo = repository({
      findBySuburb: vi.fn().mockResolvedValue([]),
    });

    await expect(resolveRecommendationLocation("Atlantis", repo)).rejects.toMatchObject({
      code: "LOCATION_NOT_FOUND",
      status: 404,
    });
  });

  it("reports ambiguous suburbs", async () => {
    const repo = repository({
      findBySuburb: vi.fn().mockResolvedValue([
        clayton,
        { ...clayton, postcode: "3000" },
      ]),
    });

    await expect(resolveRecommendationLocation("Melbourne", repo)).rejects.toMatchObject({
      code: "AMBIGUOUS_LOCATION",
      status: 422,
    });
  });

  it("exports a typed resolution error", () => {
    const error = new LocationResolutionError(
      "LOCATION_NOT_FOUND",
      404,
      "Location not found.",
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("LOCATION_NOT_FOUND");
  });
});
