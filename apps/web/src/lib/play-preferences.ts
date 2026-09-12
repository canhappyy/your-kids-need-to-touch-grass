import type { PlayPreferences } from "@/types/play-preferences";

export const defaultPlayPreferences: PlayPreferences = {
  playStyle: "solo",
  canSupervise: false,
};

export function readPlayPreferences(params: URLSearchParams): PlayPreferences {
  return {
    playStyle: params.get("playStyle") === "group" ? "group" : "solo",
    canSupervise: params.get("canSupervise") === "true",
  };
}

export function playPreferenceParams(values: Partial<PlayPreferences>) {
  return {
    playStyle: values.playStyle ?? "solo",
    canSupervise: String(values.canSupervise ?? false),
  };
}
