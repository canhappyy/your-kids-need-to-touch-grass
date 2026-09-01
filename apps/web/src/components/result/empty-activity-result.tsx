import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"

type EmptyActivityResultProps = {
  description?: string
  onAdjustFilters: () => void
  onBackToSearch: () => void
}

const DEFAULT_DESCRIPTION =
  "We couldn't find anything matching that age range, time window, and location. Try widening your search."

export function EmptyActivityResult({
  description = DEFAULT_DESCRIPTION,
  onAdjustFilters,
  onBackToSearch,
}: EmptyActivityResultProps) {
  return (
    <section
      aria-labelledby="empty-activity-title"
      className="flex min-h-[calc(100svh-6.5rem)] flex-col pt-3 pb-[72px] text-center"
    >
      <div className="flex flex-col items-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-emerald-50">
          <Search
            aria-hidden="true"
            className="size-10 text-zinc-700"
            strokeWidth={1.75}
          />
        </div>
        <h1
          className="mt-7 text-3xl font-bold tracking-tight text-zinc-900"
          id="empty-activity-title"
        >
          No activities found
        </h1>
        <p className="mt-6 max-w-sm text-base leading-snug text-zinc-500">
          {description}
        </p>
      </div>

      <div className="mt-auto space-y-3">
        <Button
          className="h-16 w-full rounded-full bg-emerald-600 px-6 text-lg font-bold text-white shadow-[0_10px_24px_rgba(5,150,90,0.25)] hover:bg-emerald-700 focus-visible:border-emerald-700 focus-visible:ring-emerald-600/30"
          onClick={onAdjustFilters}
          size="lg"
          type="button"
        >
          Adjust Filters
        </Button>
        <Button
          className="h-16 w-full rounded-full border-zinc-300 bg-white px-6 text-lg font-bold text-zinc-900 hover:bg-zinc-50 focus-visible:border-emerald-700 focus-visible:ring-emerald-600/20"
          onClick={onBackToSearch}
          size="lg"
          type="button"
          variant="outline"
        >
          Back to Search
        </Button>
      </div>
    </section>
  )
}

export type { EmptyActivityResultProps }
