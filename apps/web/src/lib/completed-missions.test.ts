import { describe, expect, it } from "vitest"
import {
  readCompletedMissions,
  saveCompletedMission,
  clearCompletedMissions,
  formatCompletionDate,
  HISTORY_KEY,
} from "./completed-missions"

function storage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  }
}
const first = { id: "1", missionId: "m1", name: "Park play", completedAt: "2026-09-12T10:00:00.000Z", durationMinutes: 20 }

describe("local completion history", () => {
  it("persists repeated missions and reads newest first", () => {
    const store = storage()
    saveCompletedMission(first, store)
    saveCompletedMission({ ...first, id: "2", completedAt: "2026-09-13T10:00:00.000Z" }, store)
    expect(readCompletedMissions(store).map(record => record.id)).toEqual(["2", "1"])
    expect(readCompletedMissions(store)[1]).toEqual(first)
  })
  it("makes saving the same completion id idempotent", () => {
    const store = storage()
    saveCompletedMission(first, store)
    saveCompletedMission(first, store)
    expect(readCompletedMissions(store)).toEqual([first])
  })
  it("clears only history", () => {
    const store = storage()
    store.setItem("other", "keep")
    saveCompletedMission(first, store)
    clearCompletedMissions(store)
    expect(readCompletedMissions(store)).toEqual([])
    expect(store.getItem("other")).toBe("keep")
  })
  it.each(["{", "{}", '[{"id":"bad"}]'])("rejects corrupt history without overwriting it", raw => {
    const store = storage()
    store.setItem(HISTORY_KEY, raw)
    expect(() => readCompletedMissions(store)).toThrow()
    expect(() => saveCompletedMission(first, store)).toThrow()
    expect(store.getItem(HISTORY_KEY)).toBe(raw)
  })
  it("reports blocked reads, writes and deletes", () => {
    const blocked = () => { throw new Error("Storage blocked") }
    const store = { getItem: blocked, setItem: blocked, removeItem: blocked }
    expect(() => readCompletedMissions(store)).toThrow()
    expect(() => saveCompletedMission(first, { ...store, getItem: () => null })).toThrow()
    expect(() => clearCompletedMissions(store)).toThrow()
  })
  it("formats completion date with medium date and short time", () => {
    const formatted = formatCompletionDate("2026-09-13T10:30:00.000Z", "en-US")
    expect(formatted).toMatch(/Sep 13, 2026/)
  })
})
