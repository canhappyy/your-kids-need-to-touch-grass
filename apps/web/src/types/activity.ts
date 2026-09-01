import type { Recommendation } from "./recommendation";

/**
 * Props for the `ActivityResult` view component.
 */
export type ActivityResultProps = {
  /** The recommendation data to display. */
  recommendation: Recommendation;
  /** Whether a retry/swap operation is currently in flight. */
  isRetrying?: boolean;
  /** Callback to navigate back to the home search page. */
  onBackToSearch: () => void;
  /** Callback to request another activity swap. */
  onTryAnother: () => void;
  /** Number of swaps remaining for this session (out of MAX_SWAPS). */
  swapsRemaining: number;
};

/**
 * Derived view-model data contract used for rendering the activity result view.
 */
export type ActivityResultViewModel = {
  /** Human-readable location label (e.g. venue name, "At home", or "Anywhere"). */
  locationLabel: string;
  /** Google Maps search URL with encoded coordinates, or null if not applicable. */
  directionsUrl: string | null;
  /** Calculated percentage of the 60-minute daily activity goal. */
  dailyGoalPercentage: number;
  /** Clamped progress value (0-100) for the UI progress bar. */
  progressValue: number;
  /** Accessible ARIA value text for screen readers. */
  goalAriaText: string;
  /** Formatted duration string (e.g. "45 minutes", "1 hour", "1 hour 30 minutes"). */
  formattedDuration: string;
  /** Formatted supervision string ("Independent play" or "Adult supervision"). */
  formattedSupervision: string;
  /** Formatted age bands label (e.g. "5-7, 8-9"). */
  agesLabel: string;
};
