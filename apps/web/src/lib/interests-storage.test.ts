import { describe, expect, it } from "vitest";

import {
  readStoredInterests,
  writeStoredInterests,
} from "./interests-storage";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("interests session storage", () => {
  it("stores trimmed interests outside the URL", () => {
    const target = storage();

    writeStoredInterests(target, "  dinosaurs and space  ");

    expect(readStoredInterests(target)).toBe("dinosaurs and space");
  });

  it("clears stored interests for a blank submission", () => {
    const target = storage();
    writeStoredInterests(target, "dinosaurs");

    writeStoredInterests(target, "   ");

    expect(readStoredInterests(target)).toBeUndefined();
  });
});
