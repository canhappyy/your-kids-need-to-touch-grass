"use client";

import { FormEvent, useCallback, useRef, useState } from "react";

import {
  defaultHomeSearchValues,
  fetchNearestPostcode,
  validateSearchForm,
} from "@/lib/home-search";
import type {
  AgeBucketId,
  HomeSearchFormProps,
  LocationMode,
} from "@/types/home-search";

/**
 * Custom hook that manages all state, validation, and geolocation logic for the home activity search form.
 *
 * How this hook works:
 * 1. Form State Management:
 *    Initializes and tracks state for location mode (nearby vs home), location text,
 *    device GPS coordinates (`deviceCoords`), selected age buckets, available time (hours and minutes),
 *    play preferences (play style and supervision availability), and validation errors.
 *
 * 2. Browser Geolocation & Reverse Geocoding (`handleUseMyLocation`):
 *    - Requests current GPS coordinates using the browser's `navigator.geolocation` API.
 *    - Calls `fetchNearestPostcode` to resolve GPS coordinates into the closest Victoria postcode.
 *    - Automatically updates the location field, stores exact GPS coordinates in `deviceCoords`, and provides status feedback.
 *    - Clears `deviceCoords` and falls back to database lookup if the user manually types or edits the location field.
 *    - Gracefully falls back to manual postcode or suburb input and auto-focuses the text field if GPS is denied or fails.
 *
 * 3. Reactive Field Handlers:
 *    Provides stable `useCallback` handlers for all form inputs (mode toggle, location text,
 *    age bucket selection, hours, minutes, and play preferences) that automatically clear relevant error messages when modified.
 *
 * 4. Client-Side Validation & Submission (`handleSubmit`):
 *    - Validates that total duration is at least 15 minutes.
 *    - Validates that a valid 4-digit postcode or suburb name is provided when in `"nearby"` mode.
 *    - If valid, invokes `onValidSubmit` with trimmed and normalized search criteria, including play preferences
 *      and device GPS coordinates (omitting location and coordinates when in `"home"` mode).
 *
 * @param props - Configuration props including `initialValues`, `initialLocationError`, and the `onValidSubmit` callback.
 * @returns An object containing all form values, field change handlers, validation errors, GPS state, and device coordinates.
 */
export function useHomeSearchForm({
  initialValues = defaultHomeSearchValues,
  initialLocationError = "",
  onValidSubmit,
}: HomeSearchFormProps) {
  const [locationMode, setLocationMode] = useState<LocationMode>(
    initialValues.locationMode,
  );
  const [location, setLocation] = useState(initialValues.location);
  const [deviceCoords, setDeviceCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    initialValues.latitude !== undefined &&
      initialValues.longitude !== undefined
      ? {
          latitude: initialValues.latitude,
          longitude: initialValues.longitude,
        }
      : null,
  );
  const [selectedBuckets, setSelectedBuckets] = useState<AgeBucketId[]>(
    initialValues.selectedBuckets ?? [],
  );
  const [playStyle, setPlayStyle] = useState(initialValues.playStyle ?? "solo");
  const [canSupervise, setCanSupervise] = useState(
    initialValues.canSupervise ?? false,
  );
  const [hours, setHours] = useState(initialValues.hours);
  const [minutes, setMinutes] = useState(initialValues.minutes);
  const [locationError, setLocationError] = useState(initialLocationError);
  const [timeError, setTimeError] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");
  const locationInputRef = useRef<HTMLInputElement>(null);

  const showGpsFallback = useCallback(() => {
    setIsLocating(false);
    setGpsStatus("");
    setDeviceCoords(null);
    setLocationError(
      "We couldn't use your location. Enter your postcode or suburb.",
    );
    locationInputRef.current?.focus();
  }, []);

  const resolveGpsPostcode = useCallback(
    async (coords: GeolocationCoordinates) => {
      try {
        const postcode = await fetchNearestPostcode({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        if (!postcode) {
          showGpsFallback();
          return;
        }

        setLocation(postcode);
        setDeviceCoords({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setLocationError("");
        setGpsStatus(`Using postcode ${postcode}.`);
        setIsLocating(false);
      } catch {
        showGpsFallback();
      }
    },
    [showGpsFallback],
  );

  const handleUseMyLocation = useCallback(() => {
    setLocationError("");
    setGpsStatus("");

    if (!navigator.geolocation) {
      showGpsFallback();
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void resolveGpsPostcode(coords);
      },
      showGpsFallback,
      {
        enableHighAccuracy: false,
        maximumAge: 300_000,
        timeout: 10_000,
      },
    );
  }, [resolveGpsPostcode, showGpsFallback]);

  const handleLocationModeChange = useCallback((mode: LocationMode) => {
    setLocationMode(mode);
    if (mode === "home") {
      setDeviceCoords(null);
    }
    setLocationError("");
  }, []);

  const handleLocationChange = useCallback((value: string) => {
    setLocation(value);
    setDeviceCoords(null);
    setGpsStatus("");
    setLocationError("");
  }, []);

  const handleSelectedBucketsChange = useCallback((buckets: AgeBucketId[]) => {
    setSelectedBuckets(buckets);
  }, []);

  const handleHoursChange = useCallback((value: number) => {
    setHours(value);
    setTimeError("");
  }, []);

  const handleMinutesChange = useCallback((value: number) => {
    setMinutes(value);
    setTimeError("");
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const validation = validateSearchForm({
        hours,
        location,
        locationMode,
        minutes,
      });

      setLocationError(validation.locationError);
      setTimeError(validation.timeError);

      if (!validation.isValid) return;

      onValidSubmit({
        playStyle,
        canSupervise,
        hours,
        location: locationMode === "nearby" ? location.trim() : "",
        latitude:
          locationMode === "nearby" && deviceCoords
            ? deviceCoords.latitude
            : undefined,
        longitude:
          locationMode === "nearby" && deviceCoords
            ? deviceCoords.longitude
            : undefined,
        locationMode,
        minutes,
        selectedBuckets,
      });
    },
    [
      canSupervise,
      deviceCoords,
      hours,
      location,
      locationMode,
      minutes,
      onValidSubmit,
      playStyle,
      selectedBuckets,
    ],
  );

  return {
    deviceCoords,
    playStyle,
    canSupervise,
    setPlayStyle,
    setCanSupervise,
    gpsStatus,
    handleHoursChange,
    handleLocationChange,
    handleLocationModeChange,
    handleMinutesChange,
    handleSelectedBucketsChange,
    handleSubmit,
    handleUseMyLocation,
    hours,
    isLocating,
    location,
    locationError,
    locationInputRef,
    locationMode,
    minutes,
    selectedBuckets,
    timeError,
  };
}
