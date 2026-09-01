import { LocateFixed } from "lucide-react";
import { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LocationInputFieldProps = {
  isLocating: boolean;
  gpsStatus: string;
  location: string;
  locationError: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onUseMyLocation: () => void;
  onLocationChange: (value: string) => void;
};

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
    <div className="mt-5">
      <Button
        aria-describedby={gpsStatus ? "location-status" : undefined}
        className="h-[52px] w-full rounded-xl border-zinc-300 bg-white text-base font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:border-emerald-700 focus-visible:ring-emerald-600/20"
        disabled={isLocating}
        onClick={onUseMyLocation}
        type="button"
        variant="outline"
      >
        <LocateFixed aria-hidden="true" />
        {isLocating ? "Finding your location…" : "Use my location"}
      </Button>

      <div className="mt-4">
        <Label
          className="mb-2 text-xs font-medium tracking-wide text-zinc-600 uppercase"
          htmlFor="location"
        >
          Postcode
        </Label>
        <Input
          aria-describedby={
            locationError
              ? "location-error"
              : gpsStatus
                ? "location-status"
                : undefined
          }
          aria-invalid={Boolean(locationError)}
          autoComplete="postal-code"
          className="h-[52px] rounded-xl border-zinc-200 bg-zinc-50 px-4 text-base shadow-xs placeholder:text-zinc-500 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20 md:text-base"
          id="location"
          inputMode="numeric"
          maxLength={4}
          name="location"
          onChange={(event) => onLocationChange(event.target.value)}
          pattern="[0-9]{4}"
          placeholder="Postcode, e.g. 3168"
          ref={inputRef}
          required
          type="text"
          value={location}
        />
      </div>
      {locationError && (
        <p
          className="mt-2 text-sm text-destructive"
          id="location-error"
          role="alert"
        >
          {locationError}
        </p>
      )}
      {gpsStatus && !locationError && (
        <p
          aria-live="polite"
          className="mt-2 text-sm text-emerald-700"
          id="location-status"
          role="status"
        >
          {gpsStatus}
        </p>
      )}
    </div>
  );
}
