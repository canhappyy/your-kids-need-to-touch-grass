import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { PlannedActivity } from "@/types/planner";
import { PlannedActivityItem } from "./planned-activity-item";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) =>
    createElement("div", { "data-slot": "dialog" }, children),
  DialogContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) =>
    createElement(
      "div",
      { "data-slot": "dialog-content", className },
      children,
    ),
  DialogHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) =>
    createElement("div", { "data-slot": "dialog-header", className }, children),
  DialogTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) =>
    createElement("h2", { "data-slot": "dialog-title", className }, children),
  DialogDescription: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) =>
    createElement(
      "p",
      { "data-slot": "dialog-description", className },
      children,
    ),
  DialogClose: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) =>
    createElement(
      "button",
      { "data-slot": "dialog-close", className },
      children,
    ),
}));

const mockPlannedActivity: PlannedActivity = {
  id: "plan-1",
  missionId: "MIS-001",
  name: "Nature Scavenger Hunt",
  plannedDate: "2026-10-04",
  createdAt: "2026-10-04T01:00:00.000Z",
  durationMinutes: 35,
  missionType: "Location-Based",
  locationLabel: "Central Park",
  instructionText: "1. Find 3 leaves.\n2. Spot a bird.",
  equipmentNeeded: "Bag|Pencil",
  iconFile: "scavenger-hunt.svg",
};

describe("PlannedActivityItem", () => {
  it("renders activity details and instruction hint", () => {
    const markup = renderToStaticMarkup(
      createElement(PlannedActivityItem, {
        activity: mockPlannedActivity,
        onRemove: vi.fn(),
      }),
    );

    expect(markup).toContain("Nature Scavenger Hunt");
    expect(markup).toContain("35 min");
    expect(markup).toContain("Central Park");
    expect(markup).toContain("Tap to view instructions");
    expect(markup).toContain(
      'aria-label="View instructions for Nature Scavenger Hunt"',
    );
  });

  it("renders instruction popup modal with title, steps, and equipment", () => {
    const markup = renderToStaticMarkup(
      createElement(PlannedActivityItem, {
        activity: mockPlannedActivity,
        onRemove: vi.fn(),
      }),
    );

    expect(markup).toContain("How to Play");
    expect(markup).toContain("Find 3 leaves.");
    expect(markup).toContain("Spot a bird.");
    expect(markup).toContain("Bag");
    expect(markup).toContain("Pencil");
    expect(markup).toContain("Equipment Needed");
  });

  it("supports destructive remove variant", () => {
    const markup = renderToStaticMarkup(
      createElement(PlannedActivityItem, {
        activity: mockPlannedActivity,
        onRemove: vi.fn(),
        removeVariant: "destructive",
      }),
    );

    expect(markup).toContain('aria-label="Remove Nature Scavenger Hunt"');
    expect(markup).toContain("Remove");
  });

  it("handles activities without equipment or instructions gracefully", () => {
    const activityWithoutDetails: PlannedActivity = {
      ...mockPlannedActivity,
      instructionText: null,
      equipmentNeeded: null,
    };

    const markup = renderToStaticMarkup(
      createElement(PlannedActivityItem, {
        activity: activityWithoutDetails,
      }),
    );

    expect(markup).toContain("Instructions unavailable for this activity.");
    expect(markup).toContain("No equipment needed");
  });
});
