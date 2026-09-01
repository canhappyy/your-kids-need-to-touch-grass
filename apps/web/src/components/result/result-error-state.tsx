import { Button } from "@/components/ui/button"

type ResultErrorStateProps = {
  error: string
  onTryAgain: () => void
  onBackToSearch: () => void
}

export function ResultErrorState({
  error,
  onTryAgain,
  onBackToSearch,
}: ResultErrorStateProps) {
  return (
    <section className="flex min-h-[calc(100svh-6.5rem)] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-zinc-900">Something went wrong</h1>
      <p className="mt-4 text-zinc-500" role="alert">
        {error}
      </p>
      <Button
        className="mt-8 h-14 w-full rounded-full bg-emerald-600 text-base font-bold text-white hover:bg-emerald-700"
        onClick={onTryAgain}
        type="button"
      >
        Try Again
      </Button>
      <Button
        className="mt-3 h-14 w-full rounded-full"
        onClick={onBackToSearch}
        type="button"
        variant="outline"
      >
        Back to Search
      </Button>
    </section>
  )
}
