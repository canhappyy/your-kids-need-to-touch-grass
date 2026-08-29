import type { Metadata } from "next"

import { HomeExperience } from "@/components/home/home-experience"

export const metadata: Metadata = {
  title: "Boredom Buster",
  description: "Find something fun for your child, fast.",
}

export default function Home() {
  return (
    <main className="min-h-svh bg-white px-6 pt-16 pb-10 text-zinc-900 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-6.5rem)] w-full max-w-md flex-col">
        <HomeExperience />
      </div>
    </main>
  )
}
