"use client";

import { AgeRangeField } from "./age-range-field";
import { LocationInputField } from "./location-input-field";
import { LocationModeField } from "./location-mode-field";
import { TimePickerField } from "./time-picker-field";
import { Button } from "@/components/ui/button";
import { useHomeSearchForm } from "@/hooks/use-home-search-form";
import { defaultHomeSearchValues } from "@/lib/home-search";
import type {
  HomeSearchFormProps,
  HomeSearchValues,
  LocationMode,
} from "@/types/home-search";

function HomeSearchForm({
  initialValues = defaultHomeSearchValues,
  initialLocationError = "",
  onValidSubmit,
}: HomeSearchFormProps) {
  const {
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
  } = useHomeSearchForm({
    initialLocationError,
    initialValues,
    onValidSubmit,
  });

  return (
    <form
      className="mt-7 flex flex-1 flex-col"
      noValidate
      onSubmit={handleSubmit}
    >
      <LocationModeField
        onChange={handleLocationModeChange}
        value={locationMode}
      />

      {locationMode === "nearby" && (
        <LocationInputField
          gpsStatus={gpsStatus}
          inputRef={locationInputRef}
          isLocating={isLocating}
          location={location}
          locationError={locationError}
          onLocationChange={handleLocationChange}
          onUseMyLocation={handleUseMyLocation}
        />
      )}

      <AgeRangeField onChange={handleAgeRangeChange} value={ageRange} />

      <TimePickerField
        hours={hours}
        minutes={minutes}
        onHoursChange={handleHoursChange}
        onMinutesChange={handleMinutesChange}
        timeError={timeError}
      />

      <div className="mt-auto pt-16 text-center">
        <Button
          className="h-12 w-full rounded-full bg-emerald-600 px-6 text-base font-bold text-white shadow-[0_10px_24px_rgba(5,150,90,0.25)] hover:bg-emerald-700 focus-visible:border-emerald-700 focus-visible:ring-emerald-600/30"
          size="lg"
          type="submit"
        >
          My Kid Needs to Touch Grass
        </Button>
        <p className="mt-7 text-sm text-zinc-500">
          Tap for a random activity idea{" "}
          {locationMode === "home" ? "at home" : "near you"}
        </p>
      </div>
    </form>
  );
}

export {
  defaultHomeSearchValues,
  HomeSearchForm,
  type HomeSearchFormProps,
  type HomeSearchValues,
  type LocationMode,
};
