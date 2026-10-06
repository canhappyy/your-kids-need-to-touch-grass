import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { HistoryOverlay } from "./history-overlay";

vi.mock("@/hooks/use-completed-missions", () => ({
  useCompletedMissions: () => ({
    records: [
      {
        id: "rec-1",
        missionId: "m1",
        name: "Climb the Big Tree",
        durationMinutes: 30,
        completedAt: "2026-10-01T12:00:00.000Z",
      },
    ],
    loading: false,
    error: "",
    refresh: vi.fn(),
    clear: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-saved-activities", () => ({
  useSavedActivities: () => ({
    savedActivities: [
      {
        id: "save-1",
        missionId: "m2",
        name: "Nature Walk",
        durationMinutes: 20,
        savedAt: "2026-10-02T12:00:00.000Z",
        instructionText: "Walk along path",
        equipmentNeeded: null,
      },
    ],
    loading: false,
    error: "",
    refresh: vi.fn(),
    remove: vi.fn(),
    markComplete: vi.fn(),
    clear: vi.fn(),
  }),
}));

describe("HistoryOverlay", () => {
  it("renders nothing when closed", () => {
    const markup = renderToStaticMarkup(
      createElement(HistoryOverlay, {
        open: false,
        onClose: () => undefined,
      }),
    );

    expect(markup).toBe("");
  });

  it("renders overlay dialog and records when open", () => {
    const markup = renderToStaticMarkup(
      createElement(HistoryOverlay, {
        open: true,
        onClose: () => undefined,
      }),
    );

    expect(markup).toContain("PlayGo &amp; Co");
    expect(markup).toContain("Activity backlog");
    expect(markup).not.toContain("Saved and completed activities on this device");
    expect(markup).toContain("Saved activities");
    expect(markup).toContain("Nature Walk");
    expect(markup).toContain("Completed missions");
    expect(markup).toContain("Climb the Big Tree");
    expect(markup).toContain("Close history");
    expect(markup).toContain("Clear history");
  });
});
