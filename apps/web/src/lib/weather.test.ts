import { describe, expect, it } from "vitest";
import { getWeatherCell, summarizeWeather } from "./weather";

const start = Date.parse("2026-09-13T13:30:00Z"); // 23:30 in Melbourne
const forecast = {
  time: [start / 1000 - 1800, start / 1000 + 1800],
  weather_code: [0, 3],
  precipitation_probability: [0, 30],
  uv_index: [0, 3],
  wind_gusts_10m: [10, 49],
};

describe("weather rules", () => {
  it("shares a cell for nearby negative coordinates, but not across its boundary", () => {
    expect(getWeatherCell(-37.921, 145.121)).toEqual(
      getWeatherCell(-37.919, 145.119),
    );
    expect(getWeatherCell(-37.909, 145.121).key).not.toBe(
      getWeatherCell(-37.911, 145.121).key,
    );
    expect(getWeatherCell(-37.921, 145.121)).toMatchObject({
      latitude: -37.92,
      longitude: 145.12,
    });
  });
  it("includes all overlapping hours across midnight and packing thresholds", () => {
    expect(summarizeWeather(forecast, start, start + 3600000)).toMatchObject({
      status: "available",
      severity: "regular",
      summary: "Cloudy. High UV: bring sunscreen. Bring an umbrella or rain jacket.",
    });
  });
  it("does not include an hour beginning exactly at the end", () => {
    expect(summarizeWeather(forecast, start, start + 1800000)).toMatchObject({
      summary: "Clear skies.",
    });
  });
  it.each([95, 96, 99])("highlights thunderstorm code %s", (code) => {
    expect(
      summarizeWeather(
        { ...forecast, weather_code: [code, 0] },
        start,
        start + 60000,
      ),
    ).toMatchObject({ severity: "severe" });
  });
  it("highlights gusts at the threshold", () => {
    expect(
      summarizeWeather(
        { ...forecast, wind_gusts_10m: [50, 0] },
        start,
        start + 60000,
      ),
    ).toMatchObject({ severity: "severe", summary: "Strong winds expected." });
  });
  it("rejects missing coverage and unknown codes", () => {
    expect(summarizeWeather(forecast, start, start + 7200000)).toEqual({
      status: "unavailable",
    });
    expect(
      summarizeWeather(
        { ...forecast, weather_code: [999, 0] },
        start,
        start + 60000,
      ),
    ).toEqual({ status: "unavailable" });
  });
});
