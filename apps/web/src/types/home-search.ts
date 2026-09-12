import type { PlayPreferences } from "@/types/play-preferences";
/**
 * Search mode for activities: "nearby" (outdoor/local open spaces) or "home" (indoor/at-home activities).
 */
export type LocationMode = "nearby" | "home";

/**
 * Tuple representing child minimum and maximum age bounds [minAge, maxAge].
 */
export type AgeRange = [number, number];

/**
 * Identifier for selectable age group buckets.
 */
export type AgeBucketId = "5-7" | "8-9" | "10-12";

/**
 * Metadata for a selectable age group bucket option.
 */
export type AgeBucketOption = {
  id: AgeBucketId;
  label: string;
  min: number;
  max: number;
};

/**
 * Search form field values submitted by the user on the home search page.
 */
export type HomeSearchValues = PlayPreferences & {
  /** Selected location mode ("nearby" or "home"). */
  locationMode: LocationMode;
  /** User-entered location (4-digit postcode or suburb name). Empty when locationMode is "home". */
  location: string;
  /** Selected age bucket IDs (e.g. ['5-7']). Empty when no bucket is selected. */
  selectedBuckets: AgeBucketId[];
  /** Available duration hours (0-12, optional). */
  hours?: number;
  /** Available duration minutes (15-90 in 15-min increments). */
  minutes: number;
  /** Optional device latitude if acquired from geolocation. */
  latitude?: number;
  /** Optional device longitude if acquired from geolocation. */
  longitude?: number;
};

/**
 * Props for the `HomeSearchForm` component.
 */
export type HomeSearchFormProps = {
  /** Optional initial form values (e.g. from URL search params on return). */
  initialValues?: HomeSearchValues;
  /** Optional initial error message to display for the location field. */
  initialLocationError?: string;
  /** Callback invoked when the form passes client-side validation and is submitted. */
  onValidSubmit: (values: HomeSearchValues) => void;
};

/**
 * Response body returned by the `/api/postcodes/nearest` endpoint.
 */
export type NearestPostcodeResponse = {
  /** The 4-digit postcode resolved from GPS coordinates. */
  postcode?: string;
};

/**
 * Result returned by the `validateSearchForm` pure validation function.
 */
export type FormValidationResult = {
  /** Error message for the location field, or empty string if valid. */
  locationError: string;
  /** Error message for the time fields, or empty string if valid. */
  timeError: string;
  /** Whether the form is completely valid without any errors. */
  isValid: boolean;
};
