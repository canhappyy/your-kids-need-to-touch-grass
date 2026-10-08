import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) =>
    createElement("div", { "data-slot": "dialog" }, children),
  DialogTrigger: ({
    children,
    render,
    ...props
  }: {
    children: React.ReactNode;
    render?: React.ReactNode;
  }) =>
    createElement(
      "button",
      {
        ...props,
        "data-has-render": Boolean(render),
        "data-slot": "dialog-trigger",
      },
      children,
    ),
  DialogContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) =>
    createElement(
      "div",
      { className, "data-slot": "dialog-content" },
      children,
    ),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    createElement("div", { "data-slot": "dialog-header" }, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    createElement("h2", { "data-slot": "dialog-title" }, children),
  DialogDescription: ({ children }: { children: React.ReactNode }) =>
    createElement("p", { "data-slot": "dialog-description" }, children),
}));

import { RewardsGallery } from "./rewards-gallery";
import { StreakCard } from "./streak-card";

describe("dashboard streak and wildlife rewards", () => {
  it("renders a muted zero streak with positive guidance", () => {
    const markup = renderToStaticMarkup(
      createElement(StreakCard, {
        rewards: {
          currentStreak: 0,
          lastCompletedDate: null,
          completionCount: 0,
          unlockedBadgeIds: [],
        },
      }),
    );

    expect(markup).toContain("0 day streak");
    expect(markup).toContain('data-streak-active="false"');
    expect(markup).toContain("Complete a mission today to start a streak.");
    expect(markup).not.toContain("missed");
  });

  it("renders an orange active flame and current count", () => {
    const markup = renderToStaticMarkup(
      createElement(StreakCard, {
        rewards: {
          currentStreak: 5,
          lastCompletedDate: "2026-10-03",
          completionCount: 2,
          unlockedBadgeIds: ["koala", "kangaroo"],
        },
      }),
    );

    expect(markup).toContain("5 day streak");
    expect(markup).toContain('data-streak-active="true"');
    expect(markup).toContain("text-[#E4633C]");
  });

  it("shows all species while keeping locked badges disabled", () => {
    const markup = renderToStaticMarkup(
      createElement(RewardsGallery, { unlockedBadgeIds: [] }),
    );

    expect(markup).not.toContain("Koala");
    expect(markup).not.toContain("Kangaroo");
    expect(markup).not.toContain("Saltwater Crocodile");
    expect(markup).not.toContain("Green Sea Turtle");
    expect(markup).not.toContain("Hidden species");
    expect(markup).toContain("koala_locked.svg");
    expect(markup).toContain("Play 14 days in a row");
    expect(markup.match(/disabled/g)).toHaveLength(4);
    expect(markup).toContain("grid-cols-2");
    expect(markup).toContain("lg:grid-cols-4");
  });

  it("makes unlocked badges clickable and includes badge dialog details", () => {
    const markup = renderToStaticMarkup(
      createElement(RewardsGallery, { unlockedBadgeIds: ["koala"] }),
    );

    expect(markup).toContain('aria-label="View Koala badge"');
    expect(markup).toContain('data-slot="dialog-content"');
    expect(markup).toContain("Koala badge earned");
    expect(markup).toContain("Earned for a 3-day activity streak.");
    expect(markup).toContain("Earned");
    expect(markup.match(/disabled/g)).toHaveLength(3);
  });
});
