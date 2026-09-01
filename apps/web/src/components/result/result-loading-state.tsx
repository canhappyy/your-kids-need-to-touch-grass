export function ResultLoadingState() {
  return (
    <div
      aria-live="polite"
      className="flex min-h-[calc(100svh-6.5rem)] items-center justify-center text-zinc-500"
      role="status"
    >
      Finding a mission…
    </div>
  )
}
