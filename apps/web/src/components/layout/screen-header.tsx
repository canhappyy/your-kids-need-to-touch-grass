import Image from "next/image";
import type { ReactNode, RefObject } from "react";
import { cn } from "@/lib/utils";

type ScreenHeaderProps = {
  /** Screen heading title. */
  title: string;
  /** Optional descriptive subtitle displayed under the title. */
  description?: string;
  /** Optional additional class name for the wrapper header element. */
  className?: string;
  /** Optional ref attached to the h1 element, useful for focus restoration in modals. */
  headingRef?: RefObject<HTMLHeadingElement | null>;
  /** Optional tabIndex for the h1 element (e.g. -1 for programmatic focus). */
  tabIndex?: number;
  /** Optional trailing elements or children displayed inside the header. */
  children?: ReactNode;
};

/**
 * Standardized top screen header displaying the PlayGo & Co brand logo,
 * responsive alignment, and page title hierarchy.
 */
export function ScreenHeader({
  title,
  description,
  className,
  headingRef,
  tabIndex,
  children,
}: ScreenHeaderProps) {
  return (
    <header className={cn("space-y-3 text-center sm:text-left", className)}>
      <Image
        src="/playgo&co.svg"
        alt="PlayGo & Co"
        width={180}
        height={36}
        priority
        className="mx-auto h-10 w-auto sm:mx-0"
      />
      <div>
        <h1
          ref={headingRef}
          tabIndex={tabIndex}
          className="text-2xl font-bold tracking-tight text-zinc-900 outline-none sm:text-3xl"
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-zinc-600 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {children}
    </header>
  );
}

export type { ScreenHeaderProps };
