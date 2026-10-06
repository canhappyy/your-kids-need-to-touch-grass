import { type RefObject } from "react";
import { ScreenHeader } from "@/components/layout/screen-header";

/**
 * Props for the {@link HistoryHeader} component.
 */
type HistoryHeaderProps = {
  /** Optional reference to the header element, used to restore focus after closing modals. */
  headingRef?: RefObject<HTMLHeadingElement | null>;
};

/**
 * Header section for the activity backlog, displaying the app logo
 * and the main screen title matching dashboard screen style.
 */
export function HistoryHeader({ headingRef }: HistoryHeaderProps) {
  return (
    <ScreenHeader
      title="Activity backlog"
      headingRef={headingRef}
      tabIndex={-1}
    />
  );
}

export type { HistoryHeaderProps };
