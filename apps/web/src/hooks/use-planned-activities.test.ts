import { describe, expect, it } from "vitest";

import { PLANNED_ACTIVITIES_KEY } from "@/lib/planned-activities";
import { isPlannerStorageEventKey } from "./use-planned-activities";

describe("planner storage synchronization", () => {
  it("refreshes for planner writes and cleared storage only", () => {
    expect(isPlannerStorageEventKey(PLANNED_ACTIVITIES_KEY)).toBe(true);
    expect(isPlannerStorageEventKey(null)).toBe(true);
    expect(isPlannerStorageEventKey("unrelated")).toBe(false);
  });
});
