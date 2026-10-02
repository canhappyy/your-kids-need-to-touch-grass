import { Loader2, MapPin } from "lucide-react";
import { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Props for the `LocationInputField` component.
 */
export type LocationInputFieldProps = {
  /** Whether GPS location resolution is currently in progress. */
  isLocating: boolean;
  /** Accessible announcement text for current GPS retrieval status. */
  gpsStatus: string;
  /** Current text value of the postcode or suburb input. */
  location: string;
  /** Validation or resolution error message, if any. */
  locationError: string;
  /** React ref attached to the HTML input element for focus management. */
  inputRef: RefObject<HTMLInputElement | null>;
  /** Callback to trigger browser geolocation lookup. */
  onUseMyLocation: () => void;
  /** Callback fired when the user types in the location text field. */
  onLocationChange: (value: string) => void;
};

/**
 * Single-row form field for entering a location with a GPS button, vertical separator, and text input.
 *
 * @param props - Component properties for location input and GPS status.
 */
export function LocationInputField({
  isLocating,
  gpsStatus,
  location,
  locationError,
  inputRef,
  onUseMyLocation,
  onLocationChange,
}: LocationInputFieldProps) {
  return (
    <div className="mt-7">
      <label
        htmlFor="location"
        className="mb-2 block text-xs font-medium tracking-wide text-zinc-600 uppercase"
      >
        Location
      </label>

      <div className="flex items-center gap-3">
        <Button
          aria-describedby={
            locationError
              ? "location-error"
              : gpsStatus
                ? "location-status"
                : undefined
          }
          aria-label={isLocating ? "Finding your location…" : "Use my location"}
          className="size-[52px] shrink-0 rounded-2xl border-[#93AB63]/60 bg-[#93AB63]/15 transition-colors hover:bg-[#93AB63]/25 focus-visible:border-[#93AB63] focus-visible:ring-[#93AB63]/30"
          disabled={isLocating}
          onClick={onUseMyLocation}
          title={isLocating ? "Finding your location…" : "Use my location"}
          type="button"
          variant="outline"
        >
          {isLocating ? (
            <Loader2
              aria-hidden="true"
              className="size-6 animate-spin text-[#93AB63]"
            />
          ) : (
            <MapPin aria-hidden="true" className="size-6 text-[#93AB63]" />
          )}
        </Button>

        <div
          aria-hidden="true"
          className="flex shrink-0 flex-col items-center justify-center text-zinc-400 select-none"
        >
          <div className="h-3 w-[1.5px] rounded-full bg-zinc-300" />
          <span className="my-0.5 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            or
          </span>
          <div className="h-3 w-[1.5px] rounded-full bg-zinc-300" />
        </div>

        <Input
          aria-describedby={
            locationError
              ? "location-error"
              : gpsStatus
                ? "location-status"
                : "location-hint"
          }
          aria-invalid={Boolean(locationError)}
          autoComplete="off"
          className="h-[52px] flex-1 rounded-2xl border-zinc-200 bg-[#F0B6A31F] px-4 text-base placeholder:text-zinc-500 focus-visible:border-[#E4633C] focus-visible:ring-[#E4633C]/20 md:text-base"
          id="location"
          maxLength={50}
          name="location"
          onChange={(event) => onLocationChange(event.target.value)}
          placeholder="Enter a location"
          ref={inputRef}
          required
          type="text"
          value={location}
        />
      </div>

      <p id="location-hint" className="mt-2 text-xs text-zinc-500">
        Address, suburb, or postcode
      </p>

      {locationError && (
        <p
          className="mt-1.5 text-sm text-destructive"
          id="location-error"
          role="alert"
        >
          {locationError}
        </p>
      )}

      {gpsStatus && !locationError && (
        <p
          aria-live="polite"
          className="mt-1.5 text-sm text-emerald-700"
          id="location-status"
          role="status"
        >
          {gpsStatus}
        </p>
      )}
    </div>
  );
}
