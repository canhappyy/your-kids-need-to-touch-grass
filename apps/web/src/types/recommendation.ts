/**
 * Explanatory reason badge displayed on an activity recommendation.
 */
export type MatchReason = {
  /** The kind of match reason ("age", "time", or "location"). */
  kind: "age" | "time" | "location";
  /** Human-readable explanation (e.g. "Ages 6-10", "Fits within 1 hour", "Near Clayton 3168"). */
  label: string;
};

/**
 * Activity mission category classification.
 */
export type MissionType = "Location-Based" | "Home-Based" | "Location-Agnostic";

/**
 * Standard child age bracket.
 */
export type AgeBand = "5-7" | "8-9" | "10-12";

/**
 * Required parental supervision level for an activity.
 */
export type SupervisionLevel = "Independent-Play-Safe" | "Needs Supervision";

/**
 * Open space venue metadata associated with a location-based recommendation.
 */
export type RecommendationVenue = {
  /** Unique open space database identifier. */
  openSpaceId: number;
  /** Name of the open space (e.g. "Central Park"). */
  name: string;
  /** Category of the open space (e.g. "Park", "Playground", "Oval"). */
  category: string;
  /** Venue latitude. */
  latitude: number;
  /** Venue longitude. */
  longitude: number;
  /** Calculated distance from user location in kilometers. */
  distanceKm: number;
};

/**
 * Complete recommendation response object including activity details, match reasons, and venue.
 */
export type Recommendation = {
  /** Unique mission identifier. */
  missionId: string;
  /** Activity title. */
  title: string;
  /** Activity summary or description. */
  description: string | null;
  /** Required equipment description. */
  equipmentNeeded: string | null;
  /** Instructions for carrying out the activity. */
  instructionText: string | null;
  /** Recommended activity duration in minutes. */
  durationMinutes: number;
  /** Mission type category. */
  missionType: MissionType;
  /** Supported age bands. */
  ageBands: AgeBand[];
  /** Required supervision level. */
  supervisionLevel: SupervisionLevel;
  /** Explanatory match reasons why this activity was chosen. */
  reasons: MatchReason[];
  /** Associated open space venue if location-based, otherwise null. */
  venue: RecommendationVenue | null;
};

/**
 * API response structure returned by `/api/recommendations`.
 */
export type RecommendationResponse = {
  /** The recommendation object, or null if no matching activities were found. */
  recommendation: Recommendation | null;
};
