import { afterEach, expect, it, vi } from "vitest";
const remote = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("@vercel/functions", () => ({ getCache: () => remote }));
import { getWeatherCache } from "./weather-cache";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.clearAllMocks();
});

it("uses shared Vercel storage with a 30-minute TTL", async () => {
  vi.stubEnv("VERCEL", "1");
  remote.get.mockResolvedValue({ fetchedAt: 1 });
  const cache = getWeatherCache();
  expect(await cache.get("cell")).toEqual({ fetchedAt: 1 });
  await cache.set("cell", { fetchedAt: 2 });
  expect(remote.set).toHaveBeenCalledWith(
    "cell",
    { fetchedAt: 2 },
    { ttl: 1800 },
  );
});

it("expires local entries at 30 minutes without extending on reads", async () => {
  vi.stubEnv("VERCEL", "");
  vi.useFakeTimers();
  vi.setSystemTime(1000000);
  const cache = getWeatherCache();
  await cache.set("local-test", { fetchedAt: 1000000 });
  vi.advanceTimersByTime(1799999);
  expect(await cache.get("local-test")).toEqual({ fetchedAt: 1000000 });
  vi.advanceTimersByTime(1);
  expect(await cache.get("local-test")).toBeUndefined();
});
