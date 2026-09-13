import { z } from "zod"
import type { CompletedMission } from "@/types/completed-mission"

export const HISTORY_KEY = "playgo.completed-missions.v1"
type HistoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">
const recordSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  name: z.string().trim().min(1),
  completedAt: z.iso.datetime(),
  durationMinutes: z.number().int().positive(),
})

export function readCompletedMissions(store: HistoryStorage = window.localStorage): CompletedMission[] {
  const raw = store.getItem(HISTORY_KEY)
  if (raw === null) return []
  const records = z.array(recordSchema).parse(JSON.parse(raw))
  return records.sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
}

export function saveCompletedMission(record: CompletedMission, store: HistoryStorage = window.localStorage): void {
  const valid = recordSchema.parse(record)
  const records = readCompletedMissions(store)
  if (records.some(item => item.id === valid.id)) return
  store.setItem(HISTORY_KEY, JSON.stringify([...records, valid]))
}

export function clearCompletedMissions(store: HistoryStorage = window.localStorage): void {
  store.removeItem(HISTORY_KEY)
}

export function formatCompletionDate(completedAt: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(completedAt))
}
