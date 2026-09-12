"use client";

import { useState } from "react";

import { AGE_BUCKETS } from "@/lib/home-search";
import type { AgeBucketId } from "@/types/home-search";

import { AgeRangePill } from "./age-range-pill";

export type AgeRangeSelectorProps = {
  selectedBuckets?: AgeBucketId[];
  onValueChange: (buckets: AgeBucketId[]) => void;
};

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
