import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BottomNav } from "./bottom-nav";

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("BottomNav", () => {
  it("renders all 3 navigation items in the correct order", () => {
    mockPathname = "/";
    const markup = renderToStaticMarkup(createElement(BottomNav));

    expect(markup).toContain("Planner");
    expect(markup).toContain("Get Activity");
    expect(markup).toContain("Dashboard");

    const plannerIdx = markup.indexOf("Planner");
    const getActIdx = markup.indexOf("Get Activity");
    const dashIdx = markup.indexOf("Dashboard");

    expect(plannerIdx).toBeLessThan(getActIdx);
    expect(getActIdx).toBeLessThan(dashIdx);
  });

  it("links to correct destinations", () => {
    mockPathname = "/";
    const markup = renderToStaticMarkup(createElement(BottomNav));

    expect(markup).toContain('href="/planner"');
    expect(markup).toContain('href="/"');
    expect(markup).toContain('href="/dashboard"');
  });

  it("marks Get Activity as active on root / and /result", () => {
    mockPathname = "/";
    let markup = renderToStaticMarkup(createElement(BottomNav));
    expect(markup).toMatch(/<a[^>]*href="\/"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/"/);

    mockPathname = "/result";
    markup = renderToStaticMarkup(createElement(BottomNav));
    expect(markup).toMatch(/<a[^>]*href="\/"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/"/);
  });

  it("marks Planner as active on /planner", () => {
    mockPathname = "/planner";
    const markup = renderToStaticMarkup(createElement(BottomNav));
    expect(markup).toMatch(/<a[^>]*href="\/planner"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/planner"/);
    expect(markup).not.toMatch(/<a[^>]*href="\/"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/"/);
  });

  it("marks Dashboard as active on /dashboard", () => {
    mockPathname = "/dashboard";
    const markup = renderToStaticMarkup(createElement(BottomNav));
    expect(markup).toMatch(/<a[^>]*href="\/dashboard"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/dashboard"/);
    expect(markup).not.toMatch(/<a[^>]*href="\/"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/"/);
  });
});
