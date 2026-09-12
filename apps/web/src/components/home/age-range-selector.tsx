"use client";

import { useEffect, useRef, useState } from "react";

import {
  AGE_BUCKETS,
  calculateRangeFromBuckets,
  getInitialBuckets,
} from "@/lib/home-search";
import type { AgeBucketId, AgeRange } from "@/types/home-search";

import { AgeRangePill } from "./age-range-pill";

export type AgeRangeSelectorProps = {
  value: AgeRange;
  onValueChange: (value: AgeRange) => void;
};

export function AgeRangeSelector({
  value,
  onValueChange,
}: AgeRangeSelectorProps) {
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
    const nextRange = calculateRangeFromBuckets(nextBuckets);
    prevValueRef.current = nextRange;
    onValueChange(nextRange);
  };

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
      {AGE_BUCKETS.map((bucket) => (
        <AgeRangePill
          bucket={bucket}
          isSelected={selectedBucketIds.includes(bucket.id)}
          key={bucket.id}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
