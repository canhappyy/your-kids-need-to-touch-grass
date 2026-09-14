/**
 * User play preferences configured on the search form.
 */
export type PlayPreferences = {
  /** The social structure of the play: "solo" for single-child play, or "group" for siblings or peer play. */
  playStyle: "solo" | "group";
  /** Whether an adult is available to actively supervise or participate in the activity. */
  canSupervise: boolean;
};

/**
 * Props for the `PlayPreferencesField` input component.
 */
export type PlayPreferencesFieldProps = PlayPreferences & {
  /** Callback fired when the parent switches between solo and group play. */
  onPlayStyleChange: (value: PlayPreferences["playStyle"]) => void;
  /** Callback fired when the parent toggles the supervision availability checkbox. */
  onSupervisionChange: (value: boolean) => void;
};
