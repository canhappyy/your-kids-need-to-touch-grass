import type { Recommendation } from "./recommendation";

/**
 * Parameter payload passed to fetch or retry a recommendation.
 */
export type RecommendationRequest = {
  /** Array of mission IDs to exclude from consideration (e.g. previously shown missions). */
  excludeMissionIds?: string[];
  /** Specific mission ID to retrieve. */
  missionId?: string;
  /** AbortSignal for request cancellation. */
  signal?: AbortSignal;
};

/**
 * Parsed search URL parameters for the Result page.
 */
export type ResultSearchParams = {
  /** Selected location mode ("nearby" or "home"). */
  locationMode: "nearby" | "home";
  /** Postcode string when locationMode is "nearby". */
  location: string;
  /** Minimum child age string. */
  ageMin: string;
  /** Maximum child age string. */
  ageMax: string;
  /** Duration hours string. */
  hours: string;
  /** Duration minutes string. */
  minutes: string;
  /** Selected mission ID if viewing a specific mission from URL. */
  selectedMissionId?: string;
  /** Number of swaps used so far. */
  swapsUsed: number;
  /** Array of previously shown mission IDs to avoid immediate repeats. */
  shownMissionIds: string[];
};

/**
 * Standard API error response body structure.
 */
export type ApiErrorResponse = {
  /** Error detail object. */
  error?: {
    /** Machine-readable error code (e.g. "LOCATION_NOT_FOUND", "INVALID_INPUT"). */
    code?: string;
    /** The request field that caused the error (e.g. "location"). */
    field?: string;
  };
};

/**
 * Discriminated union outcome of fetching a recommendation.
 */
export type FetchRecommendationResult =
  | {
      /** Successful response with a recommendation or empty state. */
      type: "success";
      /** Recommendation object or null if none matched. */
      recommendation: Recommendation | null;
    }
  | {
      /** Location resolution error that should trigger a redirect back to search. */
      type: "location_error";
      /** Error classification code. */
      errorCode: string;
    }
  | {
      /** Generic or unexpected failure. */
      type: "error";
      /** User-friendly error message. */
      message: string;
    };
