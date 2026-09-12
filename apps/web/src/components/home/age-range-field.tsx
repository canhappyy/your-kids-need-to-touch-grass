"use client";

import type { AgeRange } from "@/types/home-search";

import { AgeRangeSelector } from "./age-range-selector";

export type AgeRangeFieldProps = {
  value: AgeRange;
  onChange: (value: AgeRange) => void;
};

export function AgeRangeField({ value, onChange }: AgeRangeFieldProps) {
  return (
    <fieldset className="mt-7">
      <legend className="mb-2 text-xs font-medium tracking-wide text-zinc-600 uppercase">
        Child&apos;s age range &middot; Select one or more
      </legend>
      <AgeRangeSelector onValueChange={onChange} value={value} />
      <input name="ageMin" type="hidden" value={value[0]} />
      <input name="ageMax" type="hidden" value={value[1]} />
    </fieldset>
  );
}
