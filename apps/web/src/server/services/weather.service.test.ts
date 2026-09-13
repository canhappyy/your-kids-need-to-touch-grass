import { describe, expect, it, vi } from "vitest";
import { getMissionWeather } from "./weather.service";
import type { WeatherCache } from "./weather-cache";

const start = Date.parse("2026-09-13T10:10:00Z");
const hourly = {
  time: [start / 1000 - 600, start / 1000 + 3000],
  weather_code: [0, 3],
  precipitation_probability: [0, 0],
  uv_index: [0, 0],
  wind_gusts_10m: [0, 0],
};
const units = {
  time: "unixtime",
  weather_code: "wmo code",
  precipitation_probability: "%",
  uv_index: "",
  wind_gusts_10m: "km/h",
};
function setup() {
  let now = start;
  const entries = new Map<string, unknown>();
  const cache: WeatherCache = {
    get: async (key) => entries.get(key),
    set: async (key, value) => {
      entries.set(key, value);
    },
  };
  const fetcher = vi.fn<typeof fetch>(
    async () => new Response(JSON.stringify({ hourly, hourly_units: units })),
  );
  return {
    entries,
    cache,
    fetcher,
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}
const venue = { latitude: -37.921, longitude: 145.121 };

describe("weather lookup and cache", () => {
  it("reuses nearby cells, recomputes windows and expires without sliding", async () => {
    const deps = setup();
    expect(await getMissionWeather(venue, 15, deps)).toMatchObject({
      status: "available",
      summary: "Clear skies.",
    });
    deps.advance(1799000);
    expect(
      await getMissionWeather(
        { latitude: -37.919, longitude: 145.119 },
        60,
        deps,
      ),
    ).toMatchObject({ summary: "Cloudy." });
    expect(deps.fetcher).toHaveBeenCalledTimes(1);
    deps.advance(1000);
    await getMissionWeather(venue, 15, deps);
    expect(deps.fetcher).toHaveBeenCalledTimes(2);
    await getMissionWeather({ latitude: -38, longitude: 145 }, 15, deps);
    expect(deps.fetcher).toHaveBeenCalledTimes(3);
    const url = new URL(String(deps.fetcher.mock.calls[0]?.[0]));
    expect(url.searchParams.get("latitude")).toBe("-37.92");
    expect(url.searchParams.get("forecast_days")).toBe("2");
  });
  it("bypasses corrupt cached values and refetches missing coverage", async () => {
    const deps = setup();
    await getMissionWeather(venue, 15, deps);
    for (const key of deps.entries.keys())
      deps.entries.set(key, { fetchedAt: start, hourly: {} });
    await getMissionWeather(venue, 15, deps);
    expect(deps.fetcher).toHaveBeenCalledTimes(2);
    expect(await getMissionWeather(venue, 180, deps)).toEqual({
      status: "unavailable",
    });
    expect(deps.fetcher).toHaveBeenCalledTimes(3);
  });
  it("returns fresh weather even when cache reads and writes fail", async () => {
    const deps = setup();
    deps.cache.get = async () => {
      throw Error("cache offline");
    };
    deps.cache.set = async () => {
      throw Error("cache offline");
    };
    expect(await getMissionWeather(venue, 15, deps)).toMatchObject({
      status: "available",
    });
  });
  it.each(["http", "invalid", "timeout", "missing"])(
    "fails softly for %s without caching errors",
    async (failure) => {
      const deps = setup();
      deps.fetcher.mockImplementation(async () => {
        if (failure === "timeout")
          throw new DOMException("Timed out", "TimeoutError");
        if (failure === "http") return new Response("", { status: 503 });
        return new Response(
          JSON.stringify(
            failure === "missing"
              ? {
                  hourly: { ...hourly, uv_index: [null, 0] },
                  hourly_units: units,
                }
              : {},
          ),
        );
      });
      expect(await getMissionWeather(venue, 15, deps)).toEqual({
        status: "unavailable",
      });
      expect(deps.entries.size).toBe(0);
    },
  );
  it("does not stall recommendations when the cache hangs", async () => {
    vi.useFakeTimers();
    try {
      const deps = setup();
      deps.cache.get = () => new Promise(() => {});
      deps.cache.set = () => new Promise(() => {});
      const result = getMissionWeather(venue, 15, deps);
      await vi.advanceTimersByTimeAsync(1000);
      expect(await result).toMatchObject({ status: "available" });
    } finally {
      vi.useRealTimers();
    }
  });
  it("does not fetch without a venue", async () => {
    const deps = setup();
    expect(await getMissionWeather(null, 15, deps)).toEqual({
      status: "unavailable",
    });
    expect(deps.fetcher).not.toHaveBeenCalled();
  });
});
