import { describe, expect, it } from "vitest";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Wind,
} from "lucide-react";

import {
  getWeatherIcon,
  getWeatherPresentation,
} from "./weather-presentation";

describe("weather-presentation utilities", () => {
  describe("getWeatherIcon", () => {
    it("returns CloudSun for unavailable weather or missing object", () => {
      expect(getWeatherIcon(undefined)).toBe(CloudSun);
      expect(getWeatherIcon({ status: "unavailable" })).toBe(CloudSun);
    });

    it("resolves sunny icons for clear conditions", () => {
      expect(
        getWeatherIcon({
          status: "available",
          severity: "regular",
          summary: "Clear skies.",
          weatherCode: 0,
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(Sun);

      expect(
        getWeatherIcon({
          status: "available",
          severity: "regular",
          summary: "Mainly clear.",
          weatherCode: 1,
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(Sun);
    });

    it("resolves cloudy and partly cloudy icons", () => {
      expect(
        getWeatherIcon({
          status: "available",
          severity: "regular",
          summary: "Partly cloudy.",
          weatherCode: 2,
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(CloudSun);

      expect(
        getWeatherIcon({
          status: "available",
          severity: "regular",
          summary: "Cloudy.",
          weatherCode: 3,
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(Cloud);
    });

    it("resolves rain, drizzle, and thunderstorm icons", () => {
      expect(
        getWeatherIcon({
          status: "available",
          severity: "regular",
          summary: "Light drizzle.",
          weatherCode: 51,
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(CloudDrizzle);

      expect(
        getWeatherIcon({
          status: "available",
          severity: "regular",
          summary: "Rain. Bring an umbrella.",
          weatherCode: 63,
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(CloudRain);

      expect(
        getWeatherIcon({
          status: "available",
          severity: "severe",
          summary: "Thunderstorms expected.",
          weatherCode: 95,
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(CloudLightning);
    });

    it("resolves snow, fog, and wind", () => {
      expect(
        getWeatherIcon({
          status: "available",
          severity: "regular",
          summary: "Snow.",
          weatherCode: 73,
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(CloudSnow);

      expect(
        getWeatherIcon({
          status: "available",
          severity: "regular",
          summary: "Foggy.",
          weatherCode: 45,
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(CloudFog);

      // Wind without code fallback from summary
      expect(
        getWeatherIcon({
          status: "available",
          severity: "severe",
          summary: "Strong winds expected.",
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(Wind);
    });

    it("resolves Wind icon for strong winds even with a clear weatherCode", () => {
      expect(
        getWeatherIcon({
          status: "available",
          severity: "severe",
          summary: "Strong winds expected.",
          weatherCode: 0,
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(Wind);
    });

    it("resolves CloudSun instead of pure Sun when clear skies has rain gear advice", () => {
      expect(
        getWeatherIcon({
          status: "available",
          severity: "regular",
          summary: "Clear skies. Bring an umbrella or rain jacket.",
          weatherCode: 0,
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(CloudSun);

      expect(
        getWeatherIcon({
          status: "available",
          severity: "regular",
          summary: "Mainly clear. Bring an umbrella or rain jacket.",
          weatherCode: 1,
          startsAt: "",
          endsAt: "",
        }),
      ).toBe(CloudSun);
    });
  });

  describe("getWeatherPresentation", () => {
    it("formats unavailable weather cleanly", () => {
      const presentation = getWeatherPresentation({ status: "unavailable" });
      expect(presentation).toEqual({
        isAvailable: false,
        isSevere: false,
        Icon: CloudSun,
        headline: "Not listed",
        tips: [],
      });
    });

    it("splits headline and tips from multi-sentence summaries", () => {
      const presentation = getWeatherPresentation({
        status: "available",
        severity: "regular",
        summary: "Cloudy. Bring a rain jacket. High UV: bring sunscreen.",
        weatherCode: 3,
        startsAt: "2026-09-14T00:00:00.000Z",
        endsAt: "2026-09-14T01:00:00.000Z",
      });

      expect(presentation.headline).toBe("Cloudy");
      expect(presentation.isSevere).toBe(false);
      expect(presentation.isAvailable).toBe(true);
      expect(presentation.Icon).toBe(Cloud);
      expect(presentation.tips).toEqual([
        "Bring a rain jacket.",
        "High UV: bring sunscreen.",
      ]);
    });

    it("marks severe weather accurately", () => {
      const presentation = getWeatherPresentation({
        status: "available",
        severity: "severe",
        summary: "Thunderstorms expected. Bring an umbrella.",
        weatherCode: 95,
        startsAt: "2026-09-14T00:00:00.000Z",
        endsAt: "2026-09-14T01:00:00.000Z",
      });

      expect(presentation.headline).toBe("Thunderstorms expected");
      expect(presentation.isSevere).toBe(true);
      expect(presentation.Icon).toBe(CloudLightning);
      expect(presentation.tips).toEqual(["Bring an umbrella."]);
    });
  });
});
