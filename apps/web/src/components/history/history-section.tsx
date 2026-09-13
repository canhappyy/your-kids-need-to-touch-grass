"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { useCompletedMissions } from "@/hooks/use-completed-missions"
import { formatDuration } from "@/lib/activity"

export function HistorySection() {
  const { records, loading, error, refresh, clear } = useCompletedMissions()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/">Find a mission</Link>
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">Completed missions</h1>
      <p className="text-sm text-zinc-600">Saved only in this browser. Durations show activity time, excluding travel.</p>
      {loading && <p role="status">Loading history…</p>}
      {error && (
        <div role="alert" className="space-y-2 text-sm text-red-700">
          <p>{error}</p>
          <Button variant="outline" onClick={refresh}>Try again</Button>
        </div>
      )}
      {!loading && !error && records.length === 0 && (
        <Card><CardContent className="py-6 text-center">
          <p>No missions completed yet</p>
          <Link className="mt-3 inline-flex min-h-11 items-center underline" href="/">Find a mission</Link>
        </CardContent></Card>
      )}
      {!loading && records.length > 0 && (
        <ol className="space-y-3" aria-label="Completed mission history">
          {records.map(record => (
            <li key={record.id}>
              <Card><CardContent className="space-y-2 py-4">
                <h2 className="break-words text-lg font-semibold">{record.name}</h2>
                <div className="flex flex-wrap justify-between gap-2 text-sm text-zinc-600">
                  <time dateTime={record.completedAt}>
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.completedAt))}
                  </time>
                  <span>{formatDuration(record.durationMinutes)}</span>
                </div>
              </CardContent></Card>
            </li>
          ))}
        </ol>
      )}
      {!loading && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          {(records.length > 0 || error) && (
            <AlertDialogTrigger render={<Button variant="outline" />} className="min-h-11 w-full">Clear history</AlertDialogTrigger>
          )}
          <AlertDialogContent finalFocus={headingRef}>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear completed mission history?</AlertDialogTitle>
              <AlertDialogDescription>All completed mission records in this browser will be deleted. This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => {
                if (clear()) setConfirmOpen(false)
              }}>Clear history</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
