import { describe, expect, it, vi } from "vitest";
import { getMissionWeather } from "./weather.service";

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
  const fetcher = vi.fn<typeof fetch>(
    async () => new Response(JSON.stringify({ hourly, hourly_units: units })),
  );
  return {
    fetcher,
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

const venue = { latitude: -37.921, longitude: 145.121 };

describe("getMissionWeather", () => {
  it("requests Open-Meteo with grid cell coordinates, 30m revalidation, and cache tags", async () => {
    const deps = setup();
    const result = await getMissionWeather(venue, 15, deps);

    expect(result).toMatchObject({
      status: "available",
      summary: "Clear skies.",
    });
    expect(deps.fetcher).toHaveBeenCalledTimes(1);

    const [urlArg, init] = deps.fetcher.mock.calls[0] ?? [];
    const url = new URL(String(urlArg));

    expect(url.origin).toBe("https://api.open-meteo.com");
    expect(url.pathname).toBe("/v1/forecast");
    expect(url.searchParams.get("latitude")).toBe("-37.92");
    expect(url.searchParams.get("longitude")).toBe("145.12");
    expect(url.searchParams.get("forecast_days")).toBe("2");
    expect(url.searchParams.get("timezone")).toBe("Australia/Melbourne");

    // Asserts Next.js Server Data Cache configuration
    expect(init).toMatchObject({
      next: {
        revalidate: 1800,
        tags: ["weather:playgo:weather:v1:-1896:7256"],
      },
    });
  });

  it("reuses cached forecast data across nearby venues within the same grid cell", async () => {
    let now = start;
    const cache = new Map<string, { body: string; expiresAt: number }>();
    let networkCalls = 0;

    // Simulates Next.js Server Data Cache behavior across requests
    const cachingFetcher = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      const revalidate =
        (init as { next?: { revalidate?: number } })?.next?.revalidate ?? 1800;
      const cached = cache.get(url);
      if (cached && cached.expiresAt > now) {
        return new Response(cached.body);
      }
      networkCalls++;
      const body = JSON.stringify({ hourly, hourly_units: units });
      cache.set(url, { body, expiresAt: now + revalidate * 1000 });
      return new Response(body);
    });

    const deps = {
      fetcher: cachingFetcher,
      now: () => now,
    };

    // First lookup for venue
    const first = await getMissionWeather(venue, 15, deps);
    expect(first).toMatchObject({ summary: "Clear skies." });
    expect(networkCalls).toBe(1);

    // Nearby venue in the same ~2.2km cell uses the same grid URL -> cache hit
    now += 60000; // 1 minute later
    const nearby = await getMissionWeather(
      { latitude: -37.919, longitude: 145.119 },
      60,
      deps,
    );
    expect(nearby).toMatchObject({ summary: "Cloudy." });
    expect(networkCalls).toBe(1);

    // Venue in another grid cell -> fetches fresh forecast
    const distant = await getMissionWeather(
      { latitude: -38, longitude: 145 },
      15,
      deps,
    );
    expect(distant).toMatchObject({ status: "available" });
    expect(networkCalls).toBe(2);

    // After 30 minutes (1800s), cache expires and triggers refetch
    now += 1800000;
    await getMissionWeather(venue, 15, deps);
    expect(networkCalls).toBe(3);
  });

  it.each(["http", "invalid", "timeout", "missing"])(
    "fails softly for %s without throwing",
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
    },
  );

  it("returns unavailable and does not fetch without a venue or valid coordinates", async () => {
    const deps = setup();
    expect(await getMissionWeather(null, 15, deps)).toEqual({
      status: "unavailable",
    });
    expect(
      await getMissionWeather({ latitude: 100, longitude: 0 }, 15, deps),
    ).toEqual({ status: "unavailable" });
    expect(
      await getMissionWeather({ latitude: 0, longitude: 200 }, 15, deps),
    ).toEqual({ status: "unavailable" });
    expect(await getMissionWeather(venue, 0, deps)).toEqual({
      status: "unavailable",
    });
    expect(deps.fetcher).not.toHaveBeenCalled();
  });
});
