import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { Recommendation } from "@/types/recommendation";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) =>
    createElement("div", { "data-slot": "dialog" }, children),
  DialogTrigger: ({ children }: { children: React.ReactNode }) =>
    createElement("button", { "data-slot": "dialog-trigger" }, children),
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    createElement("div", { "data-slot": "dialog-content" }, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    createElement("div", null, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    createElement("h2", null, children),
  DialogDescription: ({ children }: { children: React.ReactNode }) =>
    createElement("p", null, children),
  DialogFooter: ({ children }: { children: React.ReactNode }) =>
    createElement("div", null, children),
}));

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
    createElement("div", { "data-slot": "alert-dialog", "data-open": open ? "true" : "false" }, children),
  AlertDialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    createElement("div", { "data-slot": "alert-dialog-content", className }, children),
  AlertDialogHeader: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    createElement("div", { "data-slot": "alert-dialog-header", className }, children),
  AlertDialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    createElement("h2", { "data-slot": "alert-dialog-title", className }, children),
  AlertDialogDescription: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    createElement("p", { "data-slot": "alert-dialog-description", className }, children),
  AlertDialogFooter: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    createElement("div", { "data-slot": "alert-dialog-footer", className }, children),
  AlertDialogAction: ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) =>
    createElement("button", { "data-slot": "alert-dialog-action", className, onClick }, children),
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ selected, defaultMonth, disabled }: { selected: Date; defaultMonth: Date; disabled: { before: Date; after: Date } }) =>
    createElement("div", {
      "aria-label": "Choose a planner date",
      "data-selected": selected.toISOString().slice(0, 10),
      "data-visible-month": defaultMonth.toISOString().slice(0, 10),
      "data-min": disabled.before.toISOString().slice(0, 10),
      "data-max": disabled.after.toISOString().slice(0, 10),
    }),
}));

import { PlannerSaveDialog } from "./planner-save-dialog";

const recommendation: Recommendation = {
  missionId: "mission-1",
  title: "Park Explorer",
  description: null,
  equipmentNeeded: null,
  instructionText: null,
  durationMinutes: 30,
  commuteMinutes: 0,
  totalMinutes: 30,
  missionType: "Home-Based",
  ageBands: ["5-7"],
  supervisionLevel: "Needs Supervision",
  varietyTags: [],
  reasons: [],
  venue: null,
};

describe("planner save dialog", () => {
  it("prefills a valid planner date and exposes the inclusive window", () => {
    const markup = renderToStaticMarkup(
      <PlannerSaveDialog
        initialDateKey="2026-11-03"
        now={new Date(2026, 9, 4, 12)}
        recommendation={recommendation}
      />,
    );

    expect(markup).toContain("Save to planner (do it later)");
    expect(markup).toContain("Choose a date");
    expect(markup).toContain('data-selected="2026-11-03"');
    expect(markup).toContain('data-visible-month="2026-11-03"');
    expect(markup).toContain('data-min="2026-10-04"');
    expect(markup).toContain('data-max="2027-10-04"');
    expect(markup).toContain("Confirm planner save");
  });

  it("falls back to today for an invalid prefill", () => {
    const markup = renderToStaticMarkup(
      <PlannerSaveDialog
        initialDateKey="2028-01-01"
        now={new Date(2026, 9, 4, 12)}
        recommendation={recommendation}
      />,
    );
    expect(markup).toContain('data-selected="2026-10-04"');
  });

  it("includes AlertDialog component for planner save confirmation", () => {
    const markup = renderToStaticMarkup(
      <PlannerSaveDialog
        initialDateKey="2026-11-03"
        now={new Date(2026, 9, 4, 12)}
        recommendation={recommendation}
      />,
    );

    expect(markup).toContain('data-slot="alert-dialog"');
    expect(markup).toContain("Saved to Planner");
    expect(markup).toContain("OK");
  });
});
