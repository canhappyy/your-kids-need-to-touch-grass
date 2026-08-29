export type MatchReason = {
  kind: "age" | "time" | "location";
  label: string;
};

export type MissionType =
  | "Location-Based"
  | "Home-Based"
  | "Location-Agnostic";

export type RecommendationVenue = {
  openSpaceId: number;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

export type Recommendation = {
  missionId: string;
  title: string;
  description: string | null;
  equipmentNeeded: string | null;
  instructionText: string | null;
  durationMinutes: number;
  missionType: MissionType;
  reasons: MatchReason[];
  venue: RecommendationVenue | null;
};

export type RecommendationResponse = {
  recommendation: Recommendation | null;
};
