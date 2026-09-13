import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, expect, it, vi } from "vitest"
import { useMissionCompletion } from "./use-mission-completion"
import { readCompletedMissions } from "@/lib/completed-missions"
import type { Recommendation } from "@/types/recommendation"

const mission: Recommendation = {
  missionId: "test", title: "Play", durationMinutes: 15, commuteMinutes: 12,
  totalMinutes: 27, description: null, equipmentNeeded: null, instructionText: null,
  missionType: "Home-Based", ageBands: ["5-7"], supervisionLevel: "Needs Supervision",
  reasons: [], venue: null,
}

afterEach(() => vi.unstubAllGlobals())

it.each([false, true])("guards duplicate clicks and replacement: retrying %s", retrying => {
  let raw: string | null = null
  const storage = {
    getItem: () => raw,
    setItem: (_key: string, value: string) => { raw = value },
    removeItem: () => { raw = null },
  }
  vi.stubGlobal("window", { localStorage: storage })
  let complete!: () => void
  function Probe() {
    complete = useMissionCompletion(mission, retrying).complete
    return null
  }
  renderToStaticMarkup(createElement(Probe))
  complete()
  complete()
  const records = readCompletedMissions(storage)
  expect(records).toHaveLength(retrying ? 0 : 1)
  if (!retrying) expect(records[0]).toMatchObject({ missionId: "test", name: "Play", durationMinutes: 15 })
})
