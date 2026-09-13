import Link from "next/link"
import type { ReactNode } from "react"
import { DialogTrigger } from "@/components/ui/dialog"
import { BookOpen, Dices } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ActivityActionsProps = {
  completionControl: ReactNode
  directionsUrl: string | null
  isRetrying?: boolean
  swapsRemaining?: number
  onTryAnother: () => void
  onBackToSearch: () => void
}

export function ActivityActions({
  completionControl,
  directionsUrl,
  isRetrying = false,
  onTryAnother,
  onBackToSearch,
}: ActivityActionsProps) {
  return (
    <div className="mt-auto pt-6 space-y-3">
      {completionControl}
      <DialogTrigger
        render={<Button size="lg" type="button" variant="outline" />}
        className="h-12 w-full rounded-full border-[#93AB63] bg-white px-6 text-base font-bold text-[#93AB63] hover:bg-zinc-50 hover:text-[#93AB63] focus-visible:border-[#93AB63] focus-visible:ring-[#93AB63]/20"
      >
        <BookOpen aria-hidden="true" />
        How to Play
      </DialogTrigger>
      {directionsUrl && (
        <a
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 w-full rounded-full bg-[#E4633C] px-6 text-base font-bold text-white hover:bg-[#c95330] focus-visible:border-[#c95330] focus-visible:ring-[#E4633C]/30"
          )}
          href={directionsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Get Directions
        </a>
      )}
      <Button
        className="h-12 w-full rounded-full border-[#93AB63] bg-white px-6 text-base font-bold text-[#93AB63] hover:bg-zinc-50 hover:text-[#93AB63] focus-visible:border-[#93AB63] focus-visible:ring-[#93AB63]/20"
        disabled={isRetrying}
        onClick={onTryAnother}
        size="lg"
        type="button"
        variant="outline"
      >
        <Dices aria-hidden="true" />
        {isRetrying ? "Finding Another…" : "Give me another"}
      </Button>
      <Button
        className="h-12 w-full rounded-full border-[#93AB63] bg-white px-6 text-base font-bold text-[#93AB63] hover:bg-zinc-50 hover:text-[#93AB63] focus-visible:border-[#93AB63] focus-visible:ring-[#93AB63]/20"
        onClick={onBackToSearch}
        size="lg"
        type="button"
        variant="outline"
      >
        Back to Search
      </Button>
      <Link href="/history" className="flex min-h-11 items-center justify-center underline underline-offset-4">History</Link>
    </div>
  )
}
