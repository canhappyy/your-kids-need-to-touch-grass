import { getCache } from "@vercel/functions";
import { WEATHER_TTL_SECONDS } from "@/lib/weather";

export interface WeatherCache {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

// Only used outside Vercel; bounded to avoid unbounded local server memory growth.
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
