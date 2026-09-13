"use client"

import { useCallback, useEffect, useState } from "react"
import { clearCompletedMissions, HISTORY_KEY, readCompletedMissions } from "@/lib/completed-missions"
import type { CompletedMission } from "@/types/completed-mission"

export function useCompletedMissions() {
  const [records, setRecords] = useState<CompletedMission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(() => {
    try {
      setRecords(readCompletedMissions())
      setError("")
    } catch {
      setError("History could not be read. Browser storage may be unavailable or damaged.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    queueMicrotask(() => { if (active) refresh() })
    const onStorage = (event: StorageEvent) => {
      if (event.key === HISTORY_KEY || event.key === null) refresh()
    }
    window.addEventListener("storage", onStorage)
    return () => {
      active = false
      window.removeEventListener("storage", onStorage)
    }
  }, [refresh])

  const clear = () => {
    try {
      clearCompletedMissions()
      setRecords([])
      setError("")
      return true
    } catch {
      setError("History could not be cleared. Check browser storage permissions and try again.")
      return false
    }
  }

  return { records, loading, error, refresh, clear }
}
