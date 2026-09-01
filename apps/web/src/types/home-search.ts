/**
 * Search mode for activities: "nearby" (outdoor/local open spaces) or "home" (indoor/at-home activities).
 */
export type LocationMode = "nearby" | "home";

/**
 * Tuple representing child minimum and maximum age bounds [minAge, maxAge].
 */
export type AgeRange = [number, number];

/**
 * Search form field values submitted by the user on the home search page.
 */
export type HomeSearchValues = {
  /** Selected location mode ("nearby" or "home"). */
  locationMode: LocationMode;
  /** User-entered location (4-digit postcode). Empty when locationMode is "home". */
  location: string;
  /** Selected child age range [minAge, maxAge]. */
  ageRange: AgeRange;
  /** Available duration hours (0-12). */
  hours: number;
  /** Available duration minutes (0-55 in 5-min increments). */
  minutes: number;
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
