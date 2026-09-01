import { Badge } from "@/components/ui/badge"
import type { MatchReason } from "@/types/recommendation"

type ActivityHeaderProps = {
  title: string
  reasons: MatchReason[]
  agesLabel: string
  formattedDuration: string
  formattedSupervision: string
}

export function ActivityHeader({
  title,
  reasons,
  agesLabel,
  formattedDuration,
  formattedSupervision,
}: ActivityHeaderProps) {
  return (
    <div className="text-center">
      <div
        aria-label="Why this mission matches"
        className="flex flex-wrap justify-center gap-2"
      >
        {reasons.map((reason) => (
          <Badge
            className="min-h-7 rounded-full bg-zinc-100 px-4 py-1 text-xs font-medium tracking-wide text-zinc-600"
            key={reason.kind}
            variant="secondary"
          >
            {reason.label}
          </Badge>
        ))}
      </div>
      <h1
        className="mt-6 text-4xl font-bold tracking-tight text-zinc-900"
        id="activity-title"
      >
        {title}
      </h1>
      <div
        aria-label="Mission details"
        className="mt-4 flex flex-wrap justify-center gap-2"
      >
        <Badge variant="outline">Ages {agesLabel}</Badge>
        <Badge variant="outline">{formattedDuration}</Badge>
        <Badge variant="outline">{formattedSupervision}</Badge>
      </div>
    </div>
  )
}
