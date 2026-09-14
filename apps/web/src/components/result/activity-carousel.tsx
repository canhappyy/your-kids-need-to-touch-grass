"use client";

import type { ReactNode } from "react";

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

import { ChainedActivityCard } from "./chained-activity-card";

export type ActivityCarouselProps = {
  primaryCard: ReactNode;
  secondaryRecommendation: Recommendation | null;
  isBusy: boolean;
  currentSlide: number;
  api?: CarouselApi;
  setApi: (api: CarouselApi) => void;
};

/**
 * Encapsulates the carousel viewport, slide indicators, and navigation controls
 * for single and chained activities.
 */
export function ActivityCarousel({
  primaryCard,
  secondaryRecommendation,
  isBusy,
  currentSlide,
  api,
  setApi,
}: ActivityCarouselProps) {
  return (
    <div className="relative w-full">
      {secondaryRecommendation && (
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
          </div>
          <span
            className="text-xs font-medium text-zinc-500"
            aria-live="polite"
          >
            {currentSlide + 1} of 2
          </span>
        </div>
      )}

      <Carousel setApi={setApi} opts={{ loop: false }} className="w-full">
        <CarouselContent className="items-stretch">
          <CarouselItem id="activity-slide-1" className="flex flex-col">
            {primaryCard}
          </CarouselItem>
          {secondaryRecommendation && (
            <CarouselItem id="activity-slide-2" className="flex flex-col">
              <ChainedActivityCard
                isBusy={isBusy}
                recommendation={secondaryRecommendation}
                className="h-full"
              />
            </CarouselItem>
          )}
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

      {secondaryRecommendation && (
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
      )}
    </div>
  );
}
