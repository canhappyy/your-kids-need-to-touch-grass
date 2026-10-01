"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";

import { HistoryOverlay } from "@/components/history/history-overlay";
import { cn } from "@/lib/utils";

type TopNavProps = {
  /** Callback when back button is clicked. If provided, renders a back button. */
  onBack?: () => void;
  /** Target URL for back navigation. If provided without onBack, renders a back Link. */
  backHref?: string;
  /** Accessible label for the back button or link. Defaults to "Back to search". */
  backAriaLabel?: string;
  /** Whether to render the completed mission history toggle button on the top right. */
  showHistory?: boolean;
  /** Optional controlled open state for the history overlay. */
  isHistoryOpen?: boolean;
  /** Optional callback fired when the history overlay open state changes. */
  onHistoryOpenChange?: (open: boolean) => void;
};

/**
 * Top navigation bar providing back navigation and a completed mission history overlay toggle.
 *
 * @param props - Component properties configuring navigation targets and history overlay visibility.
 */
export function TopNav({
  onBack,
  backHref,
  backAriaLabel = "Back to search",
  showHistory = false,
  isHistoryOpen: controlledOpen,
  onHistoryOpenChange,
}: TopNavProps) {
  const [internalOpen, setInternalOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("history") === "open";
    }
    return false;
  });
  const isHistoryOpen =
    controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = (open: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(open);
    }
    onHistoryOpenChange?.(open);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("history") === "open") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const toggleHistory = () => {
    setOpen(!isHistoryOpen);
  };

  const backControl = onBack ? (
    <button
      type="button"
      onClick={onBack}
      aria-label={backAriaLabel}
      title={backAriaLabel}
      className="fixed top-4 left-4 z-30 flex size-11 items-center justify-center rounded-full border border-black/5 bg-white/40 text-zinc-700 shadow-xs backdrop-blur-md transition-colors hover:bg-white/70 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] sm:top-6 sm:left-6"
    >
      <ArrowLeft className="size-6" />
    </button>
  ) : backHref ? (
    <Link
      href={backHref}
      aria-label={backAriaLabel}
      title={backAriaLabel}
      className="fixed top-4 left-4 z-30 flex size-11 items-center justify-center rounded-full border border-black/5 bg-white/40 text-zinc-700 shadow-xs backdrop-blur-md transition-colors hover:bg-white/70 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] sm:top-6 sm:left-6"
    >
      <ArrowLeft className="size-6" />
    </Link>
  ) : null;

  return (
    <>
      {(Boolean(backControl) || showHistory) && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 inset-x-0 z-20 h-16 bg-gradient-to-b from-[#FDF6EA] via-[#FDF6EA]/80 to-transparent backdrop-blur-md transition-colors [mask-image:linear-gradient(to_bottom,black_0%,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_45%,transparent_100%)] sm:h-28"
        />
      )}
      {backControl}
      {showHistory && (
        <>
          <button
            type="button"
            onClick={toggleHistory}
            aria-label={
              isHistoryOpen ? "Close history" : "Completed missions history"
            }
            title={isHistoryOpen ? "Close history" : "History"}
            aria-expanded={isHistoryOpen}
            className={cn(
              "fixed top-4 right-4 flex size-11 items-center justify-center rounded-full border border-black/5 text-zinc-700 shadow-xs backdrop-blur-md transition-colors hover:bg-white/70 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] sm:top-6 sm:right-6",
              isHistoryOpen
                ? "z-50 bg-black/10 text-zinc-900 hover:bg-black/15"
                : "z-30 bg-white/40",
            )}
          >
            <History className="size-6" />
          </button>
          <HistoryOverlay open={isHistoryOpen} onClose={() => setOpen(false)} />
        </>
      )}
    </>
  );
}

export type { TopNavProps };

