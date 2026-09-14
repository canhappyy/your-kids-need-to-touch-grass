import type { PlayPreferences } from "@/types/play-preferences";
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
 * Payload parameters required for requesting or replaying a chained second activity.
 */
export type ChainedRecommendationRequest = {
  /** Primary mission ID to pair the second activity with. */
  primaryMissionId: string;
  /** Open space ID of the venue where the primary mission takes place. */
  openSpaceId: number;
  /** Optional specific secondary mission ID when replaying a shared or bookmarked URL. */
  missionId?: string;
  /** Optional `AbortSignal` for request cancellation on unmount or navigation. */
  signal?: AbortSignal;
};

/**
 * State machine representing the client-side lifecycle of a chained recommendation request.
 */
export type ChainState =
  /** Initial state before any chained activity has been requested. */
  | { status: "idle" }
  /** Network request is actively in-flight. */
  | { status: "loading" }
  /** A compatible second activity was successfully found and loaded. */
  | { status: "loaded"; recommendation: Recommendation }
  /** Venue has no compatible second activity matching the time/age criteria. */
  | { status: "unavailable" }
  /** A network error or unrecoverable failure occurred during fetch. */
  | { status: "error" };

/**
 * Action events dispatched to transition the chained recommendation state machine.
 */
export type ChainAction =
  /** Dispatched when starting a new chained recommendation request. */
  | { type: "start" }
  /** Dispatched when the request succeeds with a retrieved recommendation. */
  | { type: "success"; recommendation: Recommendation }
  /** Dispatched when the server indicates no matching activity is available. */
  | { type: "unavailable" }
  /** Dispatched on network or HTTP error. */
  | { type: "failure" }
  /** Dispatched to reset the chain state back to idle (e.g. on primary activity swap). */
  | { type: "reset" };

/**
 * Parsed search URL parameters for the Result page.
 */
export type ResultSearchParams = PlayPreferences & {
  /** Selected location mode ("nearby" or "home"). */
  locationMode: "nearby" | "home";
  /** Postcode or suburb string when locationMode is "nearby". */
  location: string;
  /** Optional device latitude string if acquired from geolocation. */
  lat?: string;
  /** Optional device longitude string if acquired from geolocation. */
  lng?: string;
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
  /** Selected second mission ID if replaying a chained outing. */
  selectedSecondaryMissionId?: string;
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
