import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { Recommendation } from "@/types/recommendation";
import { MissionCompletion } from "./mission-completion";

const mockRecommendation: Recommendation = {
  missionId: "MIS-001",
  title: "Nature Scavenger Hunt",
  description: "Find natural treasures in the park.",
  equipmentNeeded: "Paper bag",
  instructionText: "Search for 3 leaves.",
  durationMinutes: 25,
  commuteMinutes: 10,
  totalMinutes: 35,
  missionType: "Location-Based",
  ageBands: ["5-7"],
  supervisionLevel: "Independent-Play-Safe",
  varietyTags: ["Nature"],
  reasons: [],
  venue: null,
};

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

describe("MissionCompletion", () => {
  it("renders save button and AlertDialog component for backlog confirmation", () => {
    const markup = renderToStaticMarkup(
      createElement(MissionCompletion, {
        recommendation: mockRecommendation,
        isRetrying: false,
      }),
    );

    expect(markup).toContain("Save this activity");
    expect(markup).toContain('data-slot="alert-dialog"');
    expect(markup).toContain("Saved to Backlog");
    expect(markup).toContain("Saved to your backlog.");
    expect(markup).toContain("OK");
  });
});
