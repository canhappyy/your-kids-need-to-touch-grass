"use client";

import { calculateRangeFromBuckets } from "@/lib/home-search";
import type { AgeBucketId } from "@/types/home-search";

import { AgeRangeSelector } from "./age-range-selector";

export type AgeRangeFieldProps = {
  selectedBuckets: AgeBucketId[];
  onChange: (buckets: AgeBucketId[]) => void;
};

export function AgeRangeField({
  selectedBuckets,
  onChange,
}: AgeRangeFieldProps) {
  const [min, max] = calculateRangeFromBuckets(selectedBuckets);

  return (
    <fieldset className="mt-7">
      <legend className="mb-2 text-xs font-medium tracking-wide text-zinc-600 uppercase">
        Child&apos;s age range &middot; Select one or more
      </legend>
      <AgeRangeSelector
        onValueChange={onChange}
        selectedBuckets={selectedBuckets}
      />
      <input name="ageMin" type="hidden" value={min} />
      <input name="ageMax" type="hidden" value={max} />
    </fieldset>
  );
}
