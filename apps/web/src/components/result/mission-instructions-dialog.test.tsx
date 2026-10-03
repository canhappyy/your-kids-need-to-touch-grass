import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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

import { MissionInstructionsDialog } from "./mission-instructions-dialog";

function renderDialog({
  title = "Nature Scavenger Hunt",
  instructionText = "Find a leaf.\nLook closely.",
  equipmentNeeded = "Scavenger hunt checklist|pencil",
}: {
  title?: string;
  instructionText?: string | null;
  equipmentNeeded?: string | null;
} = {}) {
  return renderToStaticMarkup(
    createElement(MissionInstructionsDialog, {
      title,
      instructionText,
      equipmentNeeded,
    }),
  );
}

describe("MissionInstructionsDialog", () => {
  it("renders 'How to Play' as the centered header with activity title", () => {
    const markup = renderDialog({ title: "Kite Flying Session" });

    expect(markup).toContain("How to Play");
    expect(markup).toContain("Kite Flying Session");
  });

  it("renders equipment needed badges when equipment is provided", () => {
    const markup = renderDialog({
      equipmentNeeded: "Bike or scooter|helmet",
    });

    expect(markup).toContain("Equipment Needed");
    expect(markup).toContain("Bike or scooter");
    expect(markup).toContain("helmet");
  });

  it("renders 'No equipment needed' badge when equipment is None or empty", () => {
    const markupNone = renderDialog({ equipmentNeeded: "None" });
    expect(markupNone).toContain("Equipment Needed");
    expect(markupNone).toContain("No equipment needed");

    const markupNull = renderDialog({ equipmentNeeded: null });
    expect(markupNull).toContain("No equipment needed");
  });

  it("renders instructions as a numbered list (<ol>)", () => {
    const markup = renderDialog({
      instructionText: "1. Launch your kite.\n2. Keep it flying.",
    });

    expect(markup).toContain("Instructions");
    expect(markup).toContain("<ol");
    expect(markup).toContain("Launch your kite.");
    expect(markup).toContain("Keep it flying.");
  });

  it("renders fallback message when instructions are null or empty", () => {
    const markup = renderDialog({ instructionText: null });

    expect(markup).toContain("Instructions unavailable for this activity.");
  });

  it("renders a Close button matching How to play button style", () => {
    const markup = renderDialog();

    expect(markup).toContain("Close");
    expect(markup).toContain("border-[#93AB63]");
    expect(markup).toContain("text-[#93AB63]");
    expect(markup).toContain("bg-white");
    expect(markup).toContain('data-slot="dialog-close"');
  });
});
