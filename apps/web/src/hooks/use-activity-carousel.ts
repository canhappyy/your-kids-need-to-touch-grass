"use client";

import { useEffect, useRef, useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import type { Recommendation } from "@/types/recommendation";
import type { ChainState } from "@/types/result";

export type UseActivityCarouselOptions = {
  secondaryRecommendation: Recommendation | null;
  canChain?: boolean;
  chainStatus?: ChainState["status"];
  onAddActivity?: () => void;
};

/**
 * Manages carousel API state, active slide tracking, gesture-based activity addition,
 * and slide transitions for single and chained missions.
 */
export function useActivityCarousel({
  secondaryRecommendation,
  canChain = false,
  chainStatus = "idle",
  onAddActivity,
}: UseActivityCarouselOptions) {
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

  return {
    api,
    setApi,
    currentSlide,
  };
}
