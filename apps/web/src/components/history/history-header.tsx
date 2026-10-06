import { type RefObject } from "react";
import Image from "next/image";

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
    <header className="space-y-3 text-center sm:text-left">
      <Image
        src="/playgo&co.svg"
        alt="PlayGo & Co"
        width={180}
        height={36}
        priority
        className="mx-auto h-10 w-auto sm:mx-0"
      />
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold tracking-tight text-zinc-900 outline-none sm:text-3xl"
      >
        Activity backlog
      </h1>
    </header>
  );
}

export type { HistoryHeaderProps };
