import { LocateFixed } from "lucide-react";
import { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
        className="h-[52px] w-full rounded-xl border-[#93AB63] bg-[#93AB63]/15 text-base font-semibold text-[#93AB63] hover:bg-[#93AB63]/25 hover:text-[#93AB63] focus-visible:border-[#93AB63] focus-visible:ring-[#93AB63]/20"
        disabled={isLocating}
        onClick={onUseMyLocation}
        type="button"
        variant="outline"
      >
        <LocateFixed aria-hidden="true" />
        {isLocating ? "Finding your location…" : "Use my location"}
      </Button>

      <div aria-hidden="true" className="my-4 flex items-center gap-3">
        <Separator className="flex-1 bg-zinc-200" />
        <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          or
        </span>
        <Separator className="flex-1 bg-zinc-200" />
      </div>

      <div>
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
          className="h-[52px] rounded-xl border-zinc-200 bg-[#F0B6A31F] px-4 text-base placeholder:text-zinc-500 focus-visible:border-[#E4633C] focus-visible:ring-[#E4633C]/20 md:text-base"
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
