import { getCache } from "@vercel/functions";
import { WEATHER_TTL_SECONDS } from "@/lib/weather";

/**
 * Storage contract for caching raw weather forecasts across requests.
 */
export interface WeatherCache {
  /**
   * Retrieves a cached weather entry by its cache key.
   *
   * @param key - The spatial grid cache key.
   * @returns A promise resolving to the cached value, or undefined if missing or expired.
   */
  get(key: string): Promise<unknown>;

  /**
   * Saves a weather entry in the cache with the configured TTL.
   *
   * @param key - The spatial grid cache key.
   * @param value - The parsed weather forecast payload to store.
   */
  set(key: string, value: unknown): Promise<void>;
}

/**
 * In-memory fallback cache used outside of the Vercel production environment (e.g. local dev, unit tests).
 *
 * How it works:
 * - Stores entries in a Map with an expiration timestamp (`expiresAt`).
 * - Enforces a maximum size of 256 entries: when the limit is reached, the oldest inserted key
 *   is evicted to prevent unbounded memory growth during long-running local development sessions.
 * - Automatically deletes expired entries when accessed.
 */
const localEntries = new Map<string, { value: unknown; expiresAt: number }>();
const localCache: WeatherCache = {
  async get(key) {
    const entry = localEntries.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      localEntries.delete(key);
      return undefined;
    }
    return entry.value;
  },
  async set(key, value) {
    if (localEntries.size >= 256)
      localEntries.delete(localEntries.keys().next().value!);
    localEntries.set(key, {
      value,
      expiresAt: Date.now() + WEATHER_TTL_SECONDS * 1000,
    });
  },
};

/**
 * Factory function providing the appropriate weather cache implementation based on runtime environment.
 *
 * In production on Vercel (`process.env.VERCEL` is set), it utilizes Vercel's global edge cache
 * via `@vercel/functions` with automatic TTL expiration.
 * In local development or automated tests, it falls back to the bounded in-memory cache (`localCache`).
 *
 * @returns A `WeatherCache` instance suitable for the current environment.
 */
export function getWeatherCache(): WeatherCache {
  if (!process.env.VERCEL) return localCache;
  const cache = getCache();
  return {
    get: (key) => cache.get(key),
    set: async (key, value) => {
      await cache.set(key, value, { ttl: WEATHER_TTL_SECONDS });
    },
  };
}
