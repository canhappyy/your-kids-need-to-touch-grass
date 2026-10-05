import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  CC_BY_4_LICENCE_URL,
  DATA_DISCLAIMER,
  DATA_GOVERNANCE_ABOUT,
  DATA_SOURCES,
  PRIVACY_INTRO,
  PRIVACY_POINTS,
} from "@/lib/data-governance";
import { DataGovernanceSection } from "./data-governance-section";

describe("DataGovernanceSection", () => {
  it("renders all four main data governance sections", () => {
    const markup = renderToStaticMarkup(<DataGovernanceSection />);

    expect(markup).toContain("ABOUT OUR DATA");
    expect(markup).toContain("WHERE OUR DATA COMES FROM");
    expect(markup).toContain("OUR ACTIVITY LIBRARY");
    expect(markup).toContain("YOUR PRIVACY");
  });

  it("renders About Our Data content accurately", () => {
    const markup = renderToStaticMarkup(<DataGovernanceSection />);
    expect(markup).toContain(DATA_GOVERNANCE_ABOUT.replace("&", "&amp;"));
  });

  it("renders all data sources with correct external links and secure attributes", () => {
    const markup = renderToStaticMarkup(<DataGovernanceSection />);

    for (const source of DATA_SOURCES) {
      expect(markup).toContain(source.name);
      expect(markup).toContain(source.source);
      if (source.licence) {
        expect(markup).toContain(source.licence);
      }
      if (source.note) {
        expect(markup).toContain(source.note);
      }
      expect(markup).toContain(`href="${source.url}"`);
    }

    expect(markup).toContain(`href="${CC_BY_4_LICENCE_URL}"`);
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });

  it("attributes bundled Victorian public and school holiday data", () => {
    const markup = renderToStaticMarkup(<DataGovernanceSection />);

    expect(markup).toContain("Victorian Public Holidays");
    expect(markup).toContain("Victorian School Term Dates");
    expect(markup).toContain("business.vic.gov.au");
    expect(markup).toContain("vic.gov.au/school-term-dates");
  });

  it("attributes the bundled national activity reference and guideline", () => {
    const markup = renderToStaticMarkup(<DataGovernanceSection />);

    expect(markup).toContain("National Nutrition and Physical Activity Survey 2023");
    expect(markup).toContain("Australian 24-Hour Movement Guidelines");
    expect(markup).toContain("abs.gov.au/statistics/health/food-and-nutrition");
    expect(markup).toContain("health.gov.au/topics/physical-activity");
  });

  it("renders the open data disclaimer notice", () => {
    const markup = renderToStaticMarkup(<DataGovernanceSection />);
    expect(markup).toContain(DATA_DISCLAIMER);
  });

  it("renders the activity library curation statement", () => {
    const markup = renderToStaticMarkup(<DataGovernanceSection />);
    expect(markup).toContain(
      "Every activity and mission in playgo is written and curated by the playgo team",
    );
  });

  it("renders privacy commitments and bullet items", () => {
    const markup = renderToStaticMarkup(<DataGovernanceSection />);

    expect(markup).toContain(PRIVACY_INTRO.replace(/'/g, "&#x27;"));
    for (const point of PRIVACY_POINTS) {
      expect(markup).toContain(point.replace(/'/g, "&#x27;"));
    }
  });

  it("uses the Card component structure with data-slot attributes", () => {
    const markup = renderToStaticMarkup(<DataGovernanceSection />);

    expect(markup).toContain('data-slot="card"');
    expect(markup).toContain('data-slot="card-header"');
    expect(markup).toContain('data-slot="card-title"');
    expect(markup).toContain('data-slot="card-content"');
  });
});
