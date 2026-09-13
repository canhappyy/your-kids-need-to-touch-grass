import { type RefObject } from "react";

/**
 * Props for the {@link HistoryHeader} component.
 */
type HistoryHeaderProps = {
  /** Optional reference to the header element, used to restore focus after closing modals. */
  headingRef?: RefObject<HTMLHeadingElement | null>;
};

/**
 * Header section for the history page, displaying the main page title
 * and an informative subtext clarifying that records are stored locally on the device.
 */
export function HistoryHeader({ headingRef }: HistoryHeaderProps) {
  return (
    <header className="space-y-2">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-bold outline-none"
      >
        Completed missions
      </h1>
      <p className="text-sm text-zinc-600">
        Saved only in this browser. Durations show activity time, excluding
        travel.
      </p>
    </header>
  );
}

export type { HistoryHeaderProps };
