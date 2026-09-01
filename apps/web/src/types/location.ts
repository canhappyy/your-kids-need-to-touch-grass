/**
 * Valid error codes representing location resolution failures.
 */
export type LocationErrorCode =
  | "INVALID_INPUT"
  | "LOCATION_NOT_FOUND"
  | "AMBIGUOUS_LOCATION";

/**
 * Represents a geographical postcode location with coordinates and associated suburb names.
 */
export type PostcodeLocation = {
  /** The 4-digit postcode string. */
  postcode: string;
  /** Latitude coordinate. */
  latitude: number;
  /** Longitude coordinate. */
  longitude: number;
  /** Comma-separated list of suburb names belonging to this postcode. */
  suburbs: string;
};

/**
 * A resolved geographical location containing coordinates, postcode, and a formatted display label.
 */
export type ResolvedLocation = PostcodeLocation & {
  /** Formatted human-readable label combining suburbs and postcode. */
  label: string;
};

/**
 * Repository interface for resolving location information by postcode or suburb.
 */
export type LocationRepository = {
  /** Finds a postcode location by its 4-digit postcode. */
  findByPostcode(postcode: string): Promise<PostcodeLocation | null>;
  /** Finds postcode locations by matching suburb name. */
  findBySuburb(suburb: string): Promise<PostcodeLocation[]>;
};
