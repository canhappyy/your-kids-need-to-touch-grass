import type {
  LocationErrorCode,
  LocationRepository,
  PostcodeLocation,
  ResolvedLocation,
} from "@/types/location";

export type { LocationErrorCode, LocationRepository, ResolvedLocation };

/**
 * Custom error thrown when a user-provided location string cannot be resolved unambiguously.
 */
export class LocationResolutionError extends Error {
  /**
   * @param code - The error classification code.
   * @param status - The corresponding HTTP status code (400, 404, or 422).
   * @param message - Human-readable error message.
   */
  constructor(
    public readonly code: LocationErrorCode,
    public readonly status: 400 | 404 | 422,
    message: string,
  ) {
    super(message);
    this.name = "LocationResolutionError";
  }
}

/**
 * Dynamically loads the default postcode repository implementation.
 *
 * @returns A promise resolving to a `LocationRepository` instance.
 */
async function loadDefaultRepository(): Promise<LocationRepository> {
  const repository = await import("@/server/repositories/postcode.repository");

  return {
    findByPostcode: repository.findPostcodeLocation,
    findBySuburb: repository.findPostcodeLocationsBySuburb,
  };
}

/**
 * Augments a `PostcodeLocation` with a human-readable display label.
 *
 * @param location - The postcode location record.
 * @returns A `ResolvedLocation` object with `label`.
 */
function withLabel(location: PostcodeLocation): ResolvedLocation {
  return {
    ...location,
    label: `${location.suburbs} ${location.postcode}`,
  };
}

/**
 * Resolves a raw location string (postcode or suburb name) into a single, unambiguous `ResolvedLocation`.
 *
 * @param input - The raw location input from the user.
 * @param repository - Optional repository instance for dependency injection in tests.
 * @returns A promise resolving to the unambiguous `ResolvedLocation`.
 * @throws {LocationResolutionError} If input is invalid (`INVALID_INPUT`), not found (`LOCATION_NOT_FOUND`), or matches multiple suburbs (`AMBIGUOUS_LOCATION`).
 */
export async function resolveRecommendationLocation(
  input: string,
  repository?: LocationRepository,
): Promise<ResolvedLocation> {
  const location = input.trim();
  const postcode = location.match(/\b\d{4}\b/)?.[0];

  if (/^\d+$/.test(location) && !postcode) {
    throw new LocationResolutionError(
      "INVALID_INPUT",
      400,
      "Enter a four-digit postcode or suburb.",
    );
  }

  const locationRepository = repository ?? (await loadDefaultRepository());

  if (postcode) {
    const match = await locationRepository.findByPostcode(postcode);

    if (!match) {
      throw new LocationResolutionError(
        "LOCATION_NOT_FOUND",
        404,
        "Location not found.",
      );
    }

    return withLabel(match);
  }

  const matches = await locationRepository.findBySuburb(location);

  if (matches.length === 0) {
    throw new LocationResolutionError(
      "LOCATION_NOT_FOUND",
      404,
      "Location not found.",
    );
  }

  if (matches.length > 1) {
    throw new LocationResolutionError(
      "AMBIGUOUS_LOCATION",
      422,
      "Enter a postcode to choose the correct suburb.",
    );
  }

  return withLabel(matches[0]);
}
