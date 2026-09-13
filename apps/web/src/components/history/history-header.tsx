import Link from "next/link";
import { type RefObject } from "react";

type HistoryHeaderProps = {
  headingRef?: RefObject<HTMLHeadingElement | null>;
};

export function HistoryHeader({ headingRef }: HistoryHeaderProps) {
  return (
    <header className="space-y-6">
      <Link
        className="inline-flex min-h-11 items-center underline underline-offset-4"
        href="/"
      >
        Find a mission
      </Link>
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
