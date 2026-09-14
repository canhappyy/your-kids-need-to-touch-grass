"use client";

import { useEffect, useRef, useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import type { Recommendation } from "@/types/recommendation";

/**
 * Manages carousel API state, active slide tracking, and auto-scrolling
 * to Slide 2 when a chained mission is loaded.
 */
export function useActivityCarousel(
  secondaryRecommendation: Recommendation | null,
) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const prevSecondaryRef = useRef<string | null>(null);
  useEffect(() => {
    if (secondaryRecommendation && !prevSecondaryRef.current && api) {
      api.scrollTo(1);
    }
    prevSecondaryRef.current = secondaryRecommendation?.missionId ?? null;
  }, [secondaryRecommendation, api]);

  return {
    api,
    setApi,
    currentSlide,
  };
}
