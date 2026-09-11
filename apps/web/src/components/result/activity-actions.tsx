import { Dices } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ActivityActionsProps = {
  directionsUrl: string | null
  isRetrying?: boolean
  swapsRemaining: number
  onTryAnother: () => void
  onBackToSearch: () => void
}

export function ActivityActions({
  directionsUrl,
  isRetrying = false,
  swapsRemaining,
  onTryAnother,
  onBackToSearch,
}: ActivityActionsProps) {
  return (
    <div className="mt-auto pt-6 space-y-3">
      {directionsUrl && (
        <a
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 w-full rounded-full bg-[#E4633C] px-6 text-base font-bold text-white shadow-[0_10px_24px_rgba(228,99,60,0.25)] hover:bg-[#c95330] focus-visible:border-[#c95330] focus-visible:ring-[#E4633C]/30"
          )}
          href={directionsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Get Directions
        </a>
      )}
      <Button
        aria-describedby="swap-status"
        className="h-12 w-full rounded-full border-zinc-300 bg-white px-6 text-base font-bold text-zinc-900 hover:bg-zinc-50 focus-visible:border-[#E4633C] focus-visible:ring-[#E4633C]/20"
        disabled={isRetrying || swapsRemaining === 0}
        onClick={onTryAnother}
        size="lg"
        type="button"
        variant="outline"
      >
        <Dices aria-hidden="true" />
        {isRetrying ? "Finding Another…" : "Give me another"}
      </Button>
      <p
        aria-live="polite"
        className="text-center text-sm text-zinc-500"
        id="swap-status"
        role="status"
      >
        {swapsRemaining === 0
          ? "Swap limit reached."
          : `${swapsRemaining} ${swapsRemaining === 1 ? "swap" : "swaps"} remaining`}
      </p>
      <Button
        className="h-12 w-full rounded-full border-zinc-300 bg-white px-6 text-base font-bold text-zinc-900 hover:bg-zinc-50 focus-visible:border-[#E4633C] focus-visible:ring-[#E4633C]/20"
        onClick={onBackToSearch}
        size="lg"
        type="button"
        variant="outline"
      >
        Back to Search
      </Button>
    </div>
  )
}
