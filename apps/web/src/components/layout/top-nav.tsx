import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";

type TopNavProps = {
  /** Callback when back button is clicked. If provided, renders a back button. */
  onBack?: () => void;
  /** Target URL for back navigation. If provided without onBack, renders a back Link. */
  backHref?: string;
  /** Accessible label for the back button or link. Defaults to "Back to search". */
  backAriaLabel?: string;
  /** Whether to render the completed mission history icon link on the top right. */
  showHistory?: boolean;
};

export function TopNav({
  onBack,
  backHref,
  backAriaLabel = "Back to search",
  showHistory = false,
}: TopNavProps) {
  const backControl = onBack ? (
    <button
      type="button"
      onClick={onBack}
      aria-label={backAriaLabel}
      title={backAriaLabel}
      className="absolute top-4 left-4 z-20 flex size-11 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-black/5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] sm:top-6 sm:left-6"
    >
      <ArrowLeft className="size-6" />
    </button>
  ) : backHref ? (
    <Link
      href={backHref}
      aria-label={backAriaLabel}
      title={backAriaLabel}
      className="absolute top-4 left-4 z-20 flex size-11 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-black/5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] sm:top-6 sm:left-6"
    >
      <ArrowLeft className="size-6" />
    </Link>
  ) : null;

  return (
    <>
      {backControl}
      {showHistory && (
        <Link
          href="/history"
          aria-label="Completed missions history"
          title="History"
          className="absolute top-4 right-4 z-20 flex size-11 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-black/5 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] sm:top-6 sm:right-6"
        >
          <History className="size-6" />
        </Link>
      )}
    </>
  );
}

export type { TopNavProps };
