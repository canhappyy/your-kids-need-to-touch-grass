"use client";

import { useState } from "react";

import { AGE_BUCKETS } from "@/lib/home-search";
import type { AgeBucketId } from "@/types/home-search";

import { AgeRangePill } from "./age-range-pill";

/**
 * Props for the `AgeRangeSelector` component.
 */
export type AgeRangeSelectorProps = {
  /** Optional controlled array of selected bucket IDs. */
  selectedBuckets?: AgeBucketId[];
  /** Callback fired when the selection of age buckets changes. */
  onValueChange: (buckets: AgeBucketId[]) => void;
};

/**
 * Multi-select button group allowing parents to pick one or more child age brackets.
 *
 * @param props - Component properties configuring selected buckets and change handler.
 */
export function AgeRangeSelector({
  selectedBuckets: controlledBuckets,
  onValueChange,
}: AgeRangeSelectorProps) {
  const [internalBucketIds, setInternalBucketIds] = useState<AgeBucketId[]>(
    () => controlledBuckets ?? [],
  );

  const activeBucketIds = controlledBuckets ?? internalBucketIds;

  const handleToggle = (bucketId: AgeBucketId) => {
    const nextBuckets = activeBucketIds.includes(bucketId)
      ? activeBucketIds.filter((id) => id !== bucketId)
      : [...activeBucketIds, bucketId];

    if (controlledBuckets === undefined) {
      setInternalBucketIds(nextBuckets);
    }
    onValueChange(nextBuckets);
  };

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
      {AGE_BUCKETS.map((bucket) => (
        <AgeRangePill
          bucket={bucket}
          isSelected={activeBucketIds.includes(bucket.id)}
          key={bucket.id}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
