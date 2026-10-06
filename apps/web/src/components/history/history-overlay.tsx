"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { HistorySection } from "./history-section";

/**
 * Props for the {@link HistoryOverlay} component.
 */
export type HistoryOverlayProps = {
  /** Whether the full-screen history overlay is currently open. */
  open: boolean;
  /** Callback fired to close the overlay. */
  onClose: () => void;
};

/**
 * Full-screen overlay component displaying completed mission history on top of the active page.
 *
 * Preserves the underlying page state without navigation, traps escape keys,
 * locks body scroll, and offers top-left back navigation.
 */
export function HistoryOverlay({ open, onClose }: HistoryOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      aria-label="Completed missions history"
      aria-modal="true"
      className="fixed inset-0 z-40 overflow-y-auto bg-[#FDF6EA] px-6 pt-16 pb-12 text-zinc-900 animate-in fade-in duration-200 sm:px-8 sm:pt-20"
      role="dialog"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 inset-x-0 z-45 h-16 bg-gradient-to-b from-[#FDF6EA] via-[#FDF6EA]/80 to-transparent backdrop-blur-md transition-colors [mask-image:linear-gradient(to_bottom,black_0%,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_45%,transparent_100%)] sm:h-28"
      />
      <button
        aria-label="Close history"
        className="fixed top-4 left-4 z-50 flex size-11 items-center justify-center rounded-full border border-black/5 bg-white/40 text-zinc-700 shadow-xs backdrop-blur-md transition-colors hover:bg-white/70 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] sm:top-6 sm:left-6"
        onClick={onClose}
        title="Close history"
        type="button"
      >
        <ArrowLeft className="size-6" />
      </button>

      <HistorySection onClose={onClose} />
    </div>
  );
}
