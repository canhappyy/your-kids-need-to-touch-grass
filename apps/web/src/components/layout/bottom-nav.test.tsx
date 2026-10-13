import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BottomNav } from "./bottom-nav";

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("BottomNav", () => {
  it("renders all 4 navigation items in the correct order", () => {
    mockPathname = "/";
    const markup = renderToStaticMarkup(createElement(BottomNav));

    expect(markup).toContain("Home");
    expect(markup).toContain("Find Activity");
    expect(markup).toContain("Planner");
    expect(markup).toContain("Dashboard");

    const homeIdx = markup.indexOf("Home");
    const findActIdx = markup.indexOf("Find Activity");
    const plannerIdx = markup.indexOf("Planner");
    const dashIdx = markup.indexOf("Dashboard");

    expect(homeIdx).toBeLessThan(findActIdx);
    expect(findActIdx).toBeLessThan(plannerIdx);
    expect(plannerIdx).toBeLessThan(dashIdx);
  });

  it("links to correct destinations", () => {
    mockPathname = "/";
    const markup = renderToStaticMarkup(createElement(BottomNav));

    expect(markup).toContain('href="/"');
    expect(markup).toContain('href="/search"');
    expect(markup).toContain('href="/planner"');
    expect(markup).toContain('href="/dashboard"');
  });

  it("marks Home as active on root /", () => {
    mockPathname = "/";
    const markup = renderToStaticMarkup(createElement(BottomNav));
    expect(markup).toMatch(
      /<a[^>]*href="\/"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/"/,
    );
    expect(markup).not.toMatch(
      /<a[^>]*href="\/search"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/search"/,
    );
  });

  it("marks Find Activity as active on /search and /result", () => {
    mockPathname = "/search";
    let markup = renderToStaticMarkup(createElement(BottomNav));
    expect(markup).toMatch(
      /<a[^>]*href="\/search"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/search"/,
    );

    mockPathname = "/result";
    markup = renderToStaticMarkup(createElement(BottomNav));
    expect(markup).toMatch(
      /<a[^>]*href="\/search"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/search"/,
    );
  });

  it("marks Planner as active on /planner", () => {
    mockPathname = "/planner";
    const markup = renderToStaticMarkup(createElement(BottomNav));
    expect(markup).toMatch(
      /<a[^>]*href="\/planner"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/planner"/,
    );
    expect(markup).not.toMatch(
      /<a[^>]*href="\/search"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/search"/,
    );
  });

  it("marks Dashboard as active on /dashboard", () => {
    mockPathname = "/dashboard";
    const markup = renderToStaticMarkup(createElement(BottomNav));
    expect(markup).toMatch(
      /<a[^>]*href="\/dashboard"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/dashboard"/,
    );
    expect(markup).not.toMatch(
      /<a[^>]*href="\/search"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/search"/,
    );
  });
});
