"use client";

import type { AgeBucketOption } from "@/types/home-search";

export type AgeRangePillProps = {
  bucket: AgeBucketOption;
  isSelected: boolean;
  onToggle: (id: AgeBucketOption["id"]) => void;
};

export function AgeRangePill({
  bucket,
  isSelected,
  onToggle,
}: AgeRangePillProps) {
  return (
    <label className="cursor-pointer">
      <input
        aria-label={`Age range ${bucket.label}`}
        checked={isSelected}
        className="peer sr-only"
        name="ageBucket"
        onChange={() => onToggle(bucket.id)}
        type="checkbox"
        value={bucket.id}
      />
      <span className="flex h-[52px] items-center justify-center rounded-xl border border-zinc-200 bg-[#F0B6A31F] px-2 text-center text-sm font-semibold text-zinc-800 transition-all select-none hover:border-zinc-300 hover:bg-[#F0B6A333] peer-checked:border-[#93AB63] peer-checked:bg-[#E4633C] peer-checked:font-bold peer-checked:text-white peer-checked:hover:bg-[#c95330] peer-focus-visible:ring-2 peer-focus-visible:ring-[#E4633C]/30 peer-focus-visible:ring-offset-2 sm:px-4 sm:text-base">
        {bucket.label}
      </span>
    </label>
  );
}
