export type PlayPreferences = {
  playStyle: "solo" | "group";
  canSupervise: boolean;
};

export type PlayPreferencesFieldProps = PlayPreferences & {
  onPlayStyleChange: (value: PlayPreferences["playStyle"]) => void;
  onSupervisionChange: (value: boolean) => void;
};
