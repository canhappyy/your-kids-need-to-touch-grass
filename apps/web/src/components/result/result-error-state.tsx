import { Button } from "@/components/ui/button";

/**
 * Props for the `ResultErrorState` view component.
 */
export type ResultErrorStateProps = {
  /** Error message text to display. */
  error: string;
  /** Callback fired when the user clicks "Try Again" to retry the recommendation fetch. */
  onTryAgain: () => void;
  /** Callback fired when the user clicks "Back to Search" to return to form inputs. */
  onBackToSearch: () => void;
};

/**
 * Error state screen presented when recommendation queries fail unexpectedly.
 *
 * @param props - Component properties configuring error text and recovery callbacks.
 */
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
        className="mt-8 h-14 w-full rounded-full bg-[#E4633C] text-base font-bold text-white hover:bg-[#c95330]"
        onClick={onTryAgain}
        type="button"
      >
        Try Again
      </Button>
      <Button
        className="mt-3 h-14 w-full rounded-full border-[#93AB63] bg-white text-base font-bold text-[#93AB63] hover:bg-zinc-50 hover:text-[#93AB63] focus-visible:border-[#93AB63] focus-visible:ring-[#93AB63]/20"
        onClick={onBackToSearch}
        type="button"
        variant="outline"
      >
        Back to Search
      </Button>
    </section>
  );
}
