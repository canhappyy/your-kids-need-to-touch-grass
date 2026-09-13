import type { PlayPreferences } from "@/types/play-preferences";

/**
 * Default play preferences used when initializing search forms or fallback state.
 * Defaults to solo, independent play.
 */
export const defaultPlayPreferences: PlayPreferences = {
  playStyle: "solo",
  canSupervise: false,
};

/**
 * Parses and sanitizes play preference parameters from URL query search parameters.
 *
 * @param params - URL search parameters (e.g. from page navigation or API requests).
 * @returns A validated `PlayPreferences` object with `playStyle` and `canSupervise`.
 */
export function readPlayPreferences(params: URLSearchParams): PlayPreferences {
  return {
    playStyle: params.get("playStyle") === "group" ? "group" : "solo",
    canSupervise: params.get("canSupervise") === "true",
  };
}

/**
 * Converts play preference values into string key-value pairs suitable for URL search params.
 *
 * @param values - Partial or complete play preferences.
 * @returns An object containing normalized `playStyle` and serialized `canSupervise` strings.
 */
export function playPreferenceParams(values: Partial<PlayPreferences>) {
  return {
    playStyle: values.playStyle ?? "solo",
    canSupervise: String(values.canSupervise ?? false),
  };
}
