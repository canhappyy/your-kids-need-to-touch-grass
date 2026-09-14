"use client";

import { useEffect, useRef, useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import type { Recommendation } from "@/types/recommendation";
import type { ChainState } from "@/types/result";

/**
 * Options configuring the `useActivityCarousel` hook.
 */
export type UseActivityCarouselOptions = {
  /** Mission ID of the primary activity, used to detect primary activity swaps. */
  primaryMissionId?: string;
  /** Secondary chained recommendation if loaded; otherwise `null`. */
  secondaryRecommendation: Recommendation | null;
  /** Whether the current primary mission is eligible for venue-based chaining. */
  canChain?: boolean;
  /** Current lifecycle status of chained mission discovery ("idle" | "loading" | "loaded" | "unavailable" | "error"). */
  chainStatus?: ChainState["status"];
  /** Whether an activity swap/reroll is currently in flight. */
  isRetrying?: boolean;
  /** Callback fired to trigger chained activity recommendation discovery. */
  onAddActivity?: () => void;
};

/**
 * Return type providing the Embla carousel API instance, setter, and active slide index.
 */
export type UseActivityCarouselReturn = {
  /** Active Embla Carousel API instance, or undefined prior to initialization. */
  api: CarouselApi | undefined;
  /** Setter function passed to `<Carousel setApi={setApi}>`. */
  setApi: (api: CarouselApi) => void;
  /** Zero-based index of the currently active/snapped slide (0 for Slide 1, 1 for Slide 2). */
  currentSlide: number;
};

/**
 * Custom React hook that controls the carousel behavior when families view,
 * slide between, and discover activities.
 *
 * What this hook takes care of:
 * 1. **Tracks the active card**: Keeps track of whether the parent is currently looking at Activity 1 or Activity 2.
 * 2. **Slide-to-add gesture**: When an outing is eligible for another activity and the parent swipes to the second slide,
 *    it automatically starts looking for a matching activity at that park.
 * 3. **Stays on the new card**: When the second activity finishes loading, it keeps the carousel on Activity 2 so parents
 *    can immediately read the new activity details without jumping back to the first card.
 * 4. **Smooth rollback if unavailable**: If the park has no other matching activities, it smoothly glides back to Activity 1
 *    so parents aren't left looking at a blank card.
 * 5. **Resets when swapping outings**: If the parent taps "Give me another" to roll a brand new outing, it immediately brings
 *    the carousel back to the first slide and prevents accidental triggers while loading.
 *
 * @param options - Settings for the carousel, including loaded recommendations and chaining status.
 * @returns The carousel controller (`api`, `setApi`) and the index of the currently visible card (`currentSlide`).
 */
export function useActivityCarousel({
  primaryMissionId,
  secondaryRecommendation,
  canChain = false,
  chainStatus = "idle",
  isRetrying = false,
  onAddActivity,
}: UseActivityCarouselOptions): UseActivityCarouselReturn {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    api.on("select", handleSelect);
    api.on("reInit", handleSelect);

    return () => {
      api.off("select", handleSelect);
      api.off("reInit", handleSelect);
    };
  }, [api]);

  // Reset triggered flag when status returns to idle or error (allowing retry)
  useEffect(() => {
    if (
      chainStatus === "idle" ||
      (chainStatus === "error" && currentSlide === 0)
    ) {
      triggeredRef.current = false;
    }
  }, [chainStatus, currentSlide]);

  // Activate query when user slides to Slide 2
  useEffect(() => {
    if (
      currentSlide === 1 &&
      !secondaryRecommendation &&
      canChain &&
      chainStatus === "idle" &&
      !isRetrying &&
      !triggeredRef.current
    ) {
      triggeredRef.current = true;
      onAddActivity?.();
    }
  }, [
    currentSlide,
    secondaryRecommendation,
    canChain,
    chainStatus,
    isRetrying,
    onAddActivity,
  ]);

  // When secondary recommendation loads, ensure we remain on Slide 2
  const prevSecondaryRef = useRef<string | null>(null);
  useEffect(() => {
    if (secondaryRecommendation && !prevSecondaryRef.current && api) {
      api.scrollTo(1);
    }
    prevSecondaryRef.current = secondaryRecommendation?.missionId ?? null;
  }, [secondaryRecommendation, api]);

  // If chaining is unavailable, smoothly return to Slide 1
  useEffect(() => {
    if (chainStatus === "unavailable" && api) {
      api.scrollTo(0);
    }
  }, [chainStatus, api]);

  // Return to Slide 1 when swapping to another recommendation or during retry
  useEffect(() => {
    if (isRetrying && api) {
      api.scrollTo(0);
    }
  }, [isRetrying, api]);

  const prevPrimaryRef = useRef<string | undefined>(primaryMissionId);
  useEffect(() => {
    if (
      primaryMissionId &&
      prevPrimaryRef.current &&
      primaryMissionId !== prevPrimaryRef.current &&
      api
    ) {
      api.scrollTo(0);
    }
    prevPrimaryRef.current = primaryMissionId;
  }, [primaryMissionId, api]);

  return {
    api,
    setApi,
    currentSlide,
  };
}
