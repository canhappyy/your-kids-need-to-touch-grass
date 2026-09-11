"use client";

import { useEffect, useRef, useState } from "react";

import type { AgeRange } from "@/types/home-search";

export type AgeBucketId = "5-6" | "7-9" | "10-12";

export type AgeBucketOption = {
  id: AgeBucketId;
  label: string;
  min: number;
  max: number;
};

export const AGE_BUCKETS: AgeBucketOption[] = [
  { id: "5-6", label: "5 – 6 yrs", min: 5, max: 6 },
  { id: "7-9", label: "7 – 9 yrs", min: 7, max: 9 },
  { id: "10-12", label: "10 – 12 yrs", min: 10, max: 12 },
];

export function getInitialBuckets(range: AgeRange): AgeBucketId[] {
  const [min, max] = range;
  const buckets: AgeBucketId[] = [];
  if (min <= 6 && max >= 5) buckets.push("5-6");
  if (min <= 9 && max >= 7) buckets.push("7-9");
  if (min <= 12 && max >= 10) buckets.push("10-12");
  return buckets.length > 0 ? buckets : ["7-9"];
}

export type AgeRangeFieldProps = {
  value: AgeRange;
  onChange: (value: AgeRange) => void;
};

export function AgeRangeField({ value, onChange }: AgeRangeFieldProps) {
  const [selectedBucketIds, setSelectedBucketIds] = useState<AgeBucketId[]>(() =>
    getInitialBuckets(value)
  );

  const prevValueRef = useRef(value);

  useEffect(() => {
    if (
      prevValueRef.current[0] !== value[0] ||
      prevValueRef.current[1] !== value[1]
    ) {
      prevValueRef.current = value;
      setSelectedBucketIds(getInitialBuckets(value));
    }
  }, [value]);

  const handleToggle = (bucketId: AgeBucketId) => {
    let nextBuckets: AgeBucketId[];
    if (selectedBucketIds.includes(bucketId)) {
      // Keep at least one selected per "SELECT ONE OR MORE" requirement
      if (selectedBucketIds.length === 1) {
        return;
      }
      nextBuckets = selectedBucketIds.filter((id) => id !== bucketId);
    } else {
      nextBuckets = [...selectedBucketIds, bucketId];
    }

    setSelectedBucketIds(nextBuckets);

    const selectedOptions = AGE_BUCKETS.filter((b) => nextBuckets.includes(b.id));
    const newMin = Math.min(...selectedOptions.map((b) => b.min));
    const newMax = Math.max(...selectedOptions.map((b) => b.max));

    prevValueRef.current = [newMin, newMax];
    onChange([newMin, newMax]);
  };

  return (
    <fieldset className="mt-7">
      <legend className="mb-2 text-xs font-medium tracking-wide text-zinc-600 uppercase">
        Child&apos;s age range &middot; Select one or more
      </legend>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {AGE_BUCKETS.map((bucket) => {
          const isSelected = selectedBucketIds.includes(bucket.id);
          return (
            <label className="cursor-pointer" key={bucket.id}>
              <input
                aria-label={`Age range ${bucket.label}`}
                checked={isSelected}
                className="peer sr-only"
                name="ageBucket"
                onChange={() => handleToggle(bucket.id)}
                type="checkbox"
                value={bucket.id}
              />
              <span className="flex h-[52px] items-center justify-center rounded-xl border border-zinc-200 bg-[#F0B6A31F] px-2 text-center text-sm font-semibold text-zinc-800 transition-all select-none hover:border-zinc-300 hover:bg-[#F0B6A333] peer-checked:border-[#93AB63] peer-checked:bg-[#E4633C] peer-checked:font-bold peer-checked:text-white peer-checked:hover:bg-[#c95330] peer-focus-visible:ring-2 peer-focus-visible:ring-[#E4633C]/30 peer-focus-visible:ring-offset-2 sm:px-4 sm:text-base">
                {bucket.label}
              </span>
            </label>
          );
        })}
      </div>
      <input name="ageMin" type="hidden" value={value[0]} />
      <input name="ageMax" type="hidden" value={value[1]} />
    </fieldset>
  );
}
