import { createElement, createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { LocationInputField } from "./location-input-field";

describe("LocationInputField", () => {
  it("renders in a single row with label, pin button, separator, input, and helper text", () => {
    const markup = renderToStaticMarkup(
      createElement(LocationInputField, {
        gpsStatus: "",
        inputRef: createRef<HTMLInputElement>(),
        isLocating: false,
        location: "Clayton",
        locationError: "",
        onLocationChange: vi.fn(),
        onUseMyLocation: vi.fn(),
      }),
    );

    expect(markup).toContain("Location");
    expect(markup).toContain("lucide-map-pin");
    expect(markup).toContain('aria-label="Use my location"');
    expect(markup).toContain("or");
    expect(markup).toContain('placeholder="Enter a location"');
    expect(markup).toContain("Address, suburb, or postcode");
    expect(markup).toContain('value="Clayton"');
  });

  it("renders error message when locationError is provided", () => {
    const markup = renderToStaticMarkup(
      createElement(LocationInputField, {
        gpsStatus: "",
        inputRef: createRef<HTMLInputElement>(),
        isLocating: false,
        location: "",
        locationError: "Enter a valid postcode or suburb.",
        onLocationChange: vi.fn(),
        onUseMyLocation: vi.fn(),
      }),
    );

    expect(markup).toContain("Enter a valid postcode or suburb.");
    expect(markup).toContain('id="location-error"');
  });

  it("renders GPS status when gpsStatus is provided without error", () => {
    const markup = renderToStaticMarkup(
      createElement(LocationInputField, {
        gpsStatus: "Using location near Clayton 3168",
        inputRef: createRef<HTMLInputElement>(),
        isLocating: false,
        location: "3168",
        locationError: "",
        onLocationChange: vi.fn(),
        onUseMyLocation: vi.fn(),
      }),
    );

    expect(markup).toContain("Using location near Clayton 3168");
    expect(markup).toContain('id="location-status"');
  });

  it("shows loading state when isLocating is true", () => {
    const markup = renderToStaticMarkup(
      createElement(LocationInputField, {
        gpsStatus: "",
        inputRef: createRef<HTMLInputElement>(),
        isLocating: true,
        location: "",
        locationError: "",
        onLocationChange: vi.fn(),
        onUseMyLocation: vi.fn(),
      }),
    );

    expect(markup).toContain("Finding your location…");
    expect(markup).toContain("disabled");
  });
});
