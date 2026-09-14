"use client";

import type { ReactNode } from "react";
import { ChevronRight, Plus } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/types/recommendation";
import type { ChainState } from "@/types/result";

import { ChainedActivityCard } from "./chained-activity-card";
import { DiscoverActivitySlide } from "./discover-activity-slide";

/**
 * Props for the `ActivityCarousel` component.
 */
export type ActivityCarouselProps = {
  /** React node rendering the PrimaryActivityCard (Slide 1). */
  primaryCard: ReactNode;
  /** Secondary chained recommendation if loaded; otherwise `null`. */
  secondaryRecommendation: Recommendation | null;
  /** Whether the primary mission is eligible for chained activity discovery. */
  canChain?: boolean;
  /** State machine managing chained activity request lifecycle ("idle" | "loading" | "loaded" | "unavailable" | "error"). */
  chainState?: ChainState;
  /** Name of the park/venue for contextual discovery messaging, or null if home/unspecified. */
  venueName?: string | null;
  /** Whether an activity swap or retry is currently in flight. */
  isBusy: boolean;
  /** Zero-based index of the active slide (0 for Activity 1, 1 for Activity 2 or Discover slide). */
  currentSlide: number;
  /** Active Embla Carousel API instance. */
  api?: CarouselApi;
  /** Setter function to receive the Embla Carousel API instance. */
  setApi: (api: CarouselApi) => void;
  /** Callback fired to initiate chained activity recommendation discovery. */
  onAddActivity?: () => void;
};

/**
 * Encapsulates the carousel viewport, slide indicators, and navigation controls
 * for single, discovery, and chained activities.
 *
 * Features:
 * - **Tab Navigation**: Segmented pills at the top showing `Activity 1` and either `Activity 2` or `+ Add Activity`.
 * - **Slide-to-Add Trigger**: Mounts `<DiscoverActivitySlide>` at index 1 when chaining is available, allowing parents to slide or tap `+` to add an activity.
 * - **Gestural Swipe**: Native hardware-accelerated touch swipe with threshold snapping.
 * - **Slide Position Retention**: Preserves Slide 2 view once a secondary activity is loaded.
 *
 * @param props - Carousel configuration and slide state properties.
 * @returns The React element rendering the mission carousel.
 */
export function ActivityCarousel({
  primaryCard,
  secondaryRecommendation,
  canChain = false,
  chainState,
  venueName,
  isBusy,
  currentSlide,
  api,
  setApi,
  onAddActivity,
}: ActivityCarouselProps) {
  const showTriggerSlide =
    Boolean(canChain) &&
    !secondaryRecommendation &&
    (chainState?.status !== "unavailable" || currentSlide !== 0);

  return (
    <div className="relative w-full">
      <div className="mb-3 flex items-center justify-between px-1">
        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label="Activity selection"
        >
          <button
            type="button"
            role="tab"
            aria-selected={currentSlide === 0}
            aria-controls="activity-slide-1"
            onClick={() => api?.scrollTo(0)}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-1 text-xs font-bold tracking-wide transition-all",
              currentSlide === 0
                ? "bg-[#93AB63] text-white shadow-xs"
                : "bg-zinc-200/80 text-zinc-600 hover:bg-zinc-300",
            )}
          >
            Activity 1
          </button>
          {secondaryRecommendation ? (
            <button
              type="button"
              role="tab"
              aria-selected={currentSlide === 1}
              aria-controls="activity-slide-2"
              onClick={() => api?.scrollTo(1)}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1 text-xs font-bold tracking-wide transition-all",
                currentSlide === 1
                  ? "bg-[#93AB63] text-white shadow-xs"
                  : "bg-zinc-200/80 text-zinc-600 hover:bg-zinc-300",
              )}
            >
              Activity 2
            </button>
          ) : showTriggerSlide ? (
            <button
              type="button"
              role="tab"
              aria-selected={currentSlide === 1}
              aria-controls="activity-slide-add"
              aria-label="Add another activity"
              onClick={() => {
                api?.scrollTo(1);
                if (chainState?.status === "idle") {
                  onAddActivity?.();
                }
              }}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs font-bold tracking-wide transition-all",
                currentSlide === 1
                  ? "border-[#93AB63] bg-[#93AB63] text-white shadow-xs"
                  : "border-zinc-300 bg-white/80 text-zinc-600 hover:border-[#93AB63] hover:bg-zinc-100 hover:text-[#556B2F]",
              )}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add Activity</span>
            </button>
          ) : null}
        </div>
        <span className="text-xs font-medium text-zinc-500" aria-live="polite">
          {secondaryRecommendation
            ? `${currentSlide + 1} of 2`
            : showTriggerSlide && currentSlide === 1
              ? "2 of 2"
              : "1 of 1"}
        </span>
      </div>

      <Carousel setApi={setApi} opts={{ loop: false }} className="w-full">
        <CarouselContent className="items-stretch">
          <CarouselItem id="activity-slide-1" className="flex flex-col">
            {primaryCard}
          </CarouselItem>
          {secondaryRecommendation ? (
            <CarouselItem id="activity-slide-2" className="flex flex-col">
              <ChainedActivityCard
                isBusy={isBusy}
                recommendation={secondaryRecommendation}
                className="h-full"
              />
            </CarouselItem>
          ) : showTriggerSlide ? (
            <CarouselItem id="activity-slide-add" className="flex flex-col">
              <DiscoverActivitySlide
                chainState={chainState ?? { status: "idle" }}
                venueName={venueName}
                className="h-full"
                onRetry={onAddActivity}
              />
            </CarouselItem>
          ) : null}
        </CarouselContent>

        {secondaryRecommendation && (
          <>
            <CarouselPrevious
              className="hidden sm:flex -left-5 lg:-left-12 bg-white/90 shadow-xs hover:bg-white"
              aria-label="Previous activity"
            />
            <CarouselNext
              className="hidden sm:flex -right-5 lg:-right-12 bg-white/90 shadow-xs hover:bg-white"
              aria-label="Next activity"
            />
          </>
        )}
      </Carousel>

      {secondaryRecommendation ? (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => api?.scrollTo(0)}
            className={cn(
              "h-2 rounded-full transition-all",
              currentSlide === 0 ? "w-6 bg-[#93AB63]" : "w-2 bg-zinc-300",
            )}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => api?.scrollTo(1)}
            className={cn(
              "h-2 rounded-full transition-all",
              currentSlide === 1 ? "w-6 bg-[#93AB63]" : "w-2 bg-zinc-300",
            )}
          />
        </div>
      ) : showTriggerSlide && currentSlide === 0 ? (
        <div
          className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-500"
          aria-hidden="true"
        >
          <span>Slide or tap + to discover another activity</span>
          <ChevronRight className="h-3.5 w-3.5 animate-pulse text-[#93AB63]" />
        </div>
      ) : null}
    </div>
  );
}
