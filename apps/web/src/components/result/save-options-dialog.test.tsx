import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SaveOptionsDialog } from "./save-options-dialog";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
  }) => (open ? createElement("div", { "data-slot": "dialog" }, children) : null),
  DialogContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => createElement("div", { className, "data-slot": "dialog-content" }, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    createElement("div", { "data-slot": "dialog-header" }, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    createElement("h2", { "data-slot": "dialog-title" }, children),
  DialogDescription: ({ children }: { children: React.ReactNode }) =>
    createElement("p", { "data-slot": "dialog-description" }, children),
}));

describe("SaveOptionsDialog", () => {
  it("renders Save to Backlog and Save to Planner options", () => {
    const markup = renderToStaticMarkup(
      createElement(SaveOptionsDialog, {
        open: true,
        onOpenChange: () => undefined,
        onSaveToBacklog: () => undefined,
        onOpenPlanner: () => undefined,
        activityTitle: "Nature Scavenger Hunt",
      }),
    );

    expect(markup).toContain("Save activity");
    expect(markup).toContain("Nature Scavenger Hunt");
    expect(markup).toContain("Save to Backlog");
    expect(markup).toContain("Save to Planner");
  });

  it("reflects saved states when already saved", () => {
    const markup = renderToStaticMarkup(
      createElement(SaveOptionsDialog, {
        open: true,
        onOpenChange: () => undefined,
        onSaveToBacklog: () => undefined,
        onOpenPlanner: () => undefined,
        isBacklogSaved: true,
        isPlannerSaved: true,
        activityTitle: "Park Explorer",
      }),
    );

    expect(markup).toContain("Saved to Backlog");
    expect(markup).toContain("Scheduled in Planner");
  });
});
