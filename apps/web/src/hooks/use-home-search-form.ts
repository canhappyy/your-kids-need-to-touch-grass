"use client";

import { FormEvent, useCallback, useRef, useState } from "react";

import {
  defaultHomeSearchValues,
  fetchNearestPostcode,
  validateSearchForm,
} from "@/lib/home-search";
import type {
  AgeRange,
  HomeSearchFormProps,
  LocationMode,
} from "@/types/home-search";

export function useHomeSearchForm({
  initialValues = defaultHomeSearchValues,
  initialLocationError = "",
  onValidSubmit,
}: HomeSearchFormProps) {
  const [locationMode, setLocationMode] = useState<LocationMode>(
    initialValues.locationMode,
  );
  const [location, setLocation] = useState(initialValues.location);
  const [ageRange, setAgeRange] = useState<AgeRange>([
    ...initialValues.ageRange,
  ]);
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
    setLocationError("We couldn't use your location. Enter your postcode.");
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
    setLocationError("");
  }, []);

  const handleLocationChange = useCallback((value: string) => {
    setLocation(value);
    setGpsStatus("");
    setLocationError("");
  }, []);

  const handleAgeRangeChange = useCallback((range: AgeRange) => {
    setAgeRange(range);
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
        ageRange,
        hours,
        location: locationMode === "nearby" ? location.trim() : "",
        locationMode,
        minutes,
      });
    },
    [ageRange, hours, location, locationMode, minutes, onValidSubmit],
  );

  return {
    ageRange,
    gpsStatus,
    handleAgeRangeChange,
    handleHoursChange,
    handleLocationChange,
    handleLocationModeChange,
    handleMinutesChange,
    handleSubmit,
    handleUseMyLocation,
    hours,
    isLocating,
    location,
    locationError,
    locationInputRef,
    locationMode,
    minutes,
    timeError,
  };
}
