import type { Metadata } from "next"
import { Suspense } from "react"
import { ResultSection } from "@/components/home/result-section"

export const metadata: Metadata = {
  title: "Boredom Buster - Activity Result",
  description: "Find something fun for your child, fast.",
}

export default function ResultPage() {
  return (
    <main className="min-h-svh bg-white px-6 pt-16 pb-10 text-zinc-900 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-6.5rem)] w-full max-w-md flex-col">
        <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
          <ResultSection />
        </Suspense>
      </div>
    </main>
  )
}
