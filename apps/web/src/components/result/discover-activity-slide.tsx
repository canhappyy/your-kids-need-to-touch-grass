"use client";

import { Compass, Loader2, Plus, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ChainState } from "@/types/result";

export type DiscoverActivitySlideProps = {
  chainState: ChainState;
  venueName?: string | null;
  className?: string;
  onRetry?: () => void;
};

/**
 * Renders the discovery slide in the carousel when chaining is available,
 * displaying an inviting prompt in idle state, an animated loader during search,
 * or a retry hint upon error.
 */
export function DiscoverActivitySlide({
  chainState,
  venueName,
  className,
  onRetry,
}: DiscoverActivitySlideProps) {
  const isLoading = chainState.status === "loading";
  const isError = chainState.status === "error";

  return (
    <Card
      className={cn(
        "flex h-full flex-1 flex-col justify-between border-2 border-dashed transition-all",
        isLoading
          ? "border-[#93AB63]/60 bg-[#93AB63]/5"
          : isError
            ? "border-amber-300 bg-amber-50/50"
            : "border-[#93AB63]/40 bg-gradient-to-b from-[#93AB63]/5 via-white to-[#93AB63]/10 hover:border-[#93AB63]/70",
        className,
      )}
    >
      <CardContent className="flex flex-1 flex-col justify-between py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
              isLoading
                ? "bg-[#93AB63]/20 text-[#556B2F]"
                : isError
                  ? "bg-amber-100 text-amber-800"
                  : "bg-[#93AB63]/15 text-[#556B2F]",
            )}
          >
            {isLoading ? (
              <>
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
                Finding Mission…
              </>
            ) : isError ? (
              "Couldn't Load"
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Bonus Mission
              </>
            )}
          </span>
          <span className="text-xs font-semibold text-zinc-400">
            Activity 2
          </span>
        </div>

        <div className="my-auto flex flex-col items-center py-8 text-center">
          {isLoading ? (
            <>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#93AB63]/20 text-[#556B2F] shadow-xs">
                <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-zinc-800 sm:text-xl">
                Finding another activity…
              </h3>
              <p className="mt-2 max-w-xs text-sm text-zinc-600">
                Checking venue compatibility and pairing another great mission
                {venueName ? ` at ${venueName}` : ""}.
              </p>
            </>
          ) : isError ? (
            <>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-xs">
                <Compass className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-zinc-800 sm:text-xl">
                Something went wrong
              </h3>
              <p className="mt-2 max-w-xs text-sm text-zinc-600">
                We couldn&apos;t load another activity right now.
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 rounded-full bg-[#93AB63] px-5 py-2 text-xs font-bold text-white hover:bg-[#7f9653]"
                >
                  Try Again
                </button>
              )}
            </>
          ) : (
            <>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#93AB63]/20 text-[#556B2F] shadow-xs">
                <Compass className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-zinc-800 sm:text-xl">
                Discover Another Activity
              </h3>
              <p className="mt-2 max-w-xs text-sm text-zinc-600">
                Have time to extend your outing? Release here to add a
                compatible second mission{venueName ? ` at ${venueName}` : ""}.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#93AB63]/10 px-4 py-1.5 text-xs font-semibold text-[#556B2F]">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Release here to create card
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-zinc-400">
          {isLoading
            ? "Creating your second mission card…"
            : "Slide back to Activity 1 anytime"}
        </p>
      </CardContent>
    </Card>
  );
}
