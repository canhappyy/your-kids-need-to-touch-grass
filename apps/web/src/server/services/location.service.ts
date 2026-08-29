import type { PostcodeLocation } from "@/server/repositories/postcode.repository";

type LocationErrorCode =
  | "INVALID_INPUT"
  | "LOCATION_NOT_FOUND"
  | "AMBIGUOUS_LOCATION";

export class LocationResolutionError extends Error {
  constructor(
    public readonly code: LocationErrorCode,
    public readonly status: 400 | 404 | 422,
    message: string,
  ) {
    super(message);
    this.name = "LocationResolutionError";
  }
}

export type ResolvedLocation = PostcodeLocation & {
  label: string;
};

export type LocationRepository = {
  findByPostcode(postcode: string): Promise<PostcodeLocation | null>;
  findBySuburb(suburb: string): Promise<PostcodeLocation[]>;
};

async function loadDefaultRepository(): Promise<LocationRepository> {
  const repository = await import("@/server/repositories/postcode.repository");

  return {
    findByPostcode: repository.findPostcodeLocation,
    findBySuburb: repository.findPostcodeLocationsBySuburb,
  };
}

function withLabel(location: PostcodeLocation): ResolvedLocation {
  return {
    ...location,
    label: `${location.suburbs} ${location.postcode}`,
  };
}

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
