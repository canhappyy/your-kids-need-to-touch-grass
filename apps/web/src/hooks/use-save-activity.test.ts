import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useSaveActivity,
  _resetSavedResultInstances,
} from "./use-save-activity";
import {
  readSavedActivities,
  moveSavedToCompleted,
} from "@/lib/saved-activities";
import { dispatchBacklogChangeEvent } from "@/lib/completed-missions";
import type { Recommendation } from "@/types/recommendation";

const baseRecommendation: Recommendation = {
  requestId: "req-1",
  missionId: "MIS-001",
  title: "Nature Scavenger Hunt",
  durationMinutes: 30,
  commuteMinutes: 10,
  totalMinutes: 40,
  description: null,
  equipmentNeeded: null,
  instructionText: "Find 3 leaves",
  missionType: "Location-Based",
  ageBands: ["5-7"],
  supervisionLevel: "Needs Supervision",
  reasons: [],
  venue: null,
};

describe("useSaveActivity", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
    vi.stubGlobal("window", {
      localStorage: mockStorage,
      dispatchEvent: () => true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    });
    _resetSavedResultInstances();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    _resetSavedResultInstances();
  });

  it("initializes isSaved as false for an unsaved result", () => {
    let result!: ReturnType<typeof useSaveActivity>;
    function Probe() {
      result = useSaveActivity(baseRecommendation, false);
      return null;
    }
    renderToStaticMarkup(createElement(Probe));

    expect(result.isSaved).toBe(false);
  });

  it("saves the activity and guards against duplicate clicks from one result", () => {
    let result!: ReturnType<typeof useSaveActivity>;
    function Probe() {
      result = useSaveActivity(baseRecommendation, false);
      return null;
    }
    renderToStaticMarkup(createElement(Probe));

    result.save();
    result.save(); // Duplicate click

    const records = readSavedActivities(window.localStorage);
    expect(records).toHaveLength(1);
    expect(records[0]?.missionId).toBe("MIS-001");
    expect(records[0]?.name).toBe("Nature Scavenger Hunt");
  });

  it("remains in saved state when activity is moved to completed in history", () => {
    let result!: ReturnType<typeof useSaveActivity>;
    function Probe() {
      result = useSaveActivity(baseRecommendation, false);
      return null;
    }
    renderToStaticMarkup(createElement(Probe));

    result.save();

    // Move saved activity to completed
    const savedRecords = readSavedActivities(window.localStorage);
    expect(savedRecords).toHaveLength(1);
    moveSavedToCompleted(savedRecords[0]!.id, window.localStorage);
    dispatchBacklogChangeEvent();

    // Re-render probe with same recommendation instance to check hook state
    renderToStaticMarkup(createElement(Probe));
    expect(result.isSaved).toBe(true);

    // Clicking save again should be a no-op
    result.save();
    expect(readSavedActivities(window.localStorage)).toHaveLength(0);
  });

  it("allows saving duplicate activity when received from a later request", () => {
    // 1. Request 1 saves the activity
    let result1!: ReturnType<typeof useSaveActivity>;
    function Probe1() {
      result1 = useSaveActivity(baseRecommendation, false);
      return null;
    }
    renderToStaticMarkup(createElement(Probe1));
    result1.save();
    expect(readSavedActivities(window.localStorage)).toHaveLength(1);

    // 2. Request 2 returns the same mission with a new requestId
    const request2Recommendation: Recommendation = {
      ...baseRecommendation,
      requestId: "req-2",
    };
    let result2!: ReturnType<typeof useSaveActivity>;
    function Probe2() {
      result2 = useSaveActivity(request2Recommendation, false);
      return null;
    }
    renderToStaticMarkup(createElement(Probe2));

    // Should NOT start as saved in request 2
    expect(result2.isSaved).toBe(false);

    // Saving in request 2 creates a duplicate saved entry
    result2.save();
    const records = readSavedActivities(window.localStorage);
    expect(records).toHaveLength(2);
    expect(records[0]?.missionId).toBe("MIS-001");
    expect(records[1]?.missionId).toBe("MIS-001");
  });
});
