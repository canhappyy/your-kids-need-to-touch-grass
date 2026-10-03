import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SavedActivityItem } from "./saved-activity-item";
import type { SavedActivity } from "@/types/saved-activity";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) =>
    createElement("div", { "data-slot": "dialog" }, children),
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    createElement("div", { "data-slot": "dialog-content", className }, children),
  DialogHeader: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    createElement("div", { "data-slot": "dialog-header", className }, children),
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    createElement("h2", { "data-slot": "dialog-title", className }, children),
  DialogDescription: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    createElement("p", { "data-slot": "dialog-description", className }, children),
  DialogClose: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    createElement("button", { "data-slot": "dialog-close", className }, children),
}));

const sampleActivity: SavedActivity = {
  id: "save-1",
  missionId: "MIS-001",
  name: "Nature Scavenger Hunt",
  savedAt: "2026-10-03T10:00:00.000Z",
  durationMinutes: 30,
  instructionText: "Find 3 leaves",
  equipmentNeeded: "Bag|pencil",
};

describe("SavedActivityItem", () => {
  it("renders activity title, duration, and check and cross action buttons", () => {
    const onComplete = vi.fn();
    const onRemove = vi.fn();

    const markup = renderToStaticMarkup(
      createElement(SavedActivityItem, {
        activity: sampleActivity,
        onComplete,
        onRemove,
      }),
    );

    expect(markup).toContain("Nature Scavenger Hunt");
    expect(markup).toContain("30 mins");
    expect(markup).toContain('aria-label="Mark Nature Scavenger Hunt as completed"');
    expect(markup).toContain('aria-label="Remove Nature Scavenger Hunt from saved"');
  });

  it("includes the instructions dialog with title and equipment", () => {
    const markup = renderToStaticMarkup(
      createElement(SavedActivityItem, {
        activity: sampleActivity,
        onComplete: vi.fn(),
        onRemove: vi.fn(),
      }),
    );

    expect(markup).toContain("How to Play");
    expect(markup).toContain("Bag");
    expect(markup).toContain("pencil");
  });
});
