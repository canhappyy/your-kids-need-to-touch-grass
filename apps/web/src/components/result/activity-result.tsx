"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useActivityResult } from "@/hooks/use-activity-result";
import { calculateDailyGoalProgress, formatDuration } from "@/lib/activity";
import { cn } from "@/lib/utils";
import type { ActivityResultProps } from "@/types/activity";

import { ActivityActions } from "./activity-actions";
import { ActivityDetails } from "./activity-details";
import { ActivityHeader } from "./activity-header";
import { ActivityProgress } from "./activity-progress";
import { ChainedActivityCard } from "./chained-activity-card";
import { MissionCompletion } from "./mission-completion";
import { MissionInstructionsDialog } from "./mission-instructions-dialog";
import { MissionWeather } from "./mission-weather";

/**
 * Renders the activity recommendation result view, including mission carousel,
 * weather forecasts, daily activity progress, and action controls.
 */
function ActivityResult({
  recommendation,
  chainState,
  isBusy,
  isRetrying = false,
  onAddActivity,
  onTryAnother,
}: ActivityResultProps) {
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

  const {
    agesLabel,
    directionsUrl,
    formattedDuration,
    formattedTotalDuration,
    formattedCommuteDuration,
    formattedSupervision,
    locationLabel,
  } = useActivityResult(recommendation);

  const secondaryRecommendation =
    chainState.status === "loaded" ? chainState.recommendation : null;

  // Auto-advance to chained activity slide when newly loaded
  const prevSecondaryRef = useRef<string | null>(null);
  useEffect(() => {
    if (secondaryRecommendation && !prevSecondaryRef.current && api) {
      api.scrollTo(1);
    }
    prevSecondaryRef.current = secondaryRecommendation?.missionId ?? null;
  }, [secondaryRecommendation, api]);

  const combinedActivityMinutes =
    recommendation.durationMinutes +
    (secondaryRecommendation?.durationMinutes ?? 0);
  const combinedOutingMinutes =
    recommendation.totalMinutes +
    (secondaryRecommendation?.durationMinutes ?? 0);
  const {
    dailyGoalPercentage,
    label: goalAriaText,
    progressValue,
  } = calculateDailyGoalProgress(combinedActivityMinutes);
  const canChain =
    recommendation.venue !== null && recommendation.durationMinutes < 60;
  const outingWeather =
    secondaryRecommendation?.weather ?? recommendation.weather;

  const primaryMissionCardContent = (
    <Card className="bg-white">
      <CardContent className="space-y-5 py-5 sm:px-6">
        {secondaryRecommendation && (
          <p className="text-center text-sm font-bold tracking-wide text-[#E4633C] uppercase">
            Activity 1
          </p>
        )}
        <div className="relative">
          <DialogTrigger
            aria-label={`How to Play: ${recommendation.title}`}
            className="absolute inset-0 z-10 cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] focus-visible:ring-offset-4"
          />
          <ActivityHeader
            agesLabel={agesLabel}
            formattedDuration={
              formattedCommuteDuration !== null && !secondaryRecommendation
                ? `${formattedTotalDuration} total (est.)`
                : formattedDuration
            }
            formattedSupervision={formattedSupervision}
            reasons={recommendation.reasons}
            title={recommendation.title}
          />

          <ActivityDetails
            activityCount={secondaryRecommendation ? 2 : 1}
            formattedTotalDuration={
              secondaryRecommendation
                ? formatDuration(combinedOutingMinutes)
                : formattedTotalDuration
            }
            formattedCommuteDuration={formattedCommuteDuration}
            formattedDuration={formatDuration(combinedActivityMinutes)}
            locationLabel={locationLabel}
          />
        </div>

        {secondaryRecommendation && (
          <>
            <MissionCompletion
              recommendation={recommendation}
              isRetrying={isBusy}
            />
            <DialogTrigger
              render={<Button size="lg" type="button" variant="outline" />}
              className="h-12 w-full rounded-full border-[#93AB63] bg-white px-6 text-base font-bold text-[#93AB63] hover:bg-zinc-50 hover:text-[#93AB63] focus-visible:border-[#93AB63] focus-visible:ring-[#93AB63]/20"
            >
              <BookOpen aria-hidden="true" />
              How to Play
            </DialogTrigger>
          </>
        )}

        <MissionInstructionsDialog
          title={recommendation.title}
          instructionText={recommendation.instructionText}
        />
      </CardContent>
    </Card>
  );

  const carouselMarkup = (
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

      <Carousel
        setApi={setApi}
        opts={{ loop: false }}
        className="w-full"
      >
        <CarouselContent>
          <CarouselItem id="activity-slide-1">
            {secondaryRecommendation ? (
              <Dialog key={recommendation.missionId}>
                {primaryMissionCardContent}
              </Dialog>
            ) : (
              primaryMissionCardContent
            )}
          </CarouselItem>
          {secondaryRecommendation && (
            <CarouselItem id="activity-slide-2">
              <ChainedActivityCard
                isBusy={isBusy}
                recommendation={secondaryRecommendation}
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
        <div
          className="mt-3 flex justify-center gap-1.5"
          aria-hidden="true"
        >
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

  const sharedOutingContent = (
    <>
      {canChain && !secondaryRecommendation && (
        <div className="mt-6 space-y-3">
          {chainState.status !== "unavailable" && (
            <Button
              className="h-12 w-full rounded-full bg-[#93AB63] text-base font-bold text-white hover:bg-[#7f9653]"
              disabled={isBusy}
              onClick={onAddActivity}
              size="lg"
              type="button"
            >
              <Plus aria-hidden="true" />
              {chainState.status === "loading"
                ? "Adding activity…"
                : chainState.status === "error"
                  ? "Try adding again"
                  : "Add another activity here"}
            </Button>
          )}
          {chainState.status === "unavailable" && (
            <p className="text-center text-sm text-zinc-600" role="status">
              No additional activity is available at this location.
            </p>
          )}
          {chainState.status === "error" && (
            <p className="text-center text-sm text-red-700" role="alert">
              We couldn&apos;t add another activity. Try again.
            </p>
          )}
        </div>
      )}

      <MissionWeather weather={outingWeather} />

      <ActivityProgress
        dailyGoalPercentage={dailyGoalPercentage}
        goalAriaText={goalAriaText}
        progressValue={progressValue}
      />

      <ActivityActions
        completionControl={
          secondaryRecommendation ? null : (
            <MissionCompletion
              recommendation={recommendation}
              isRetrying={isBusy}
            />
          )
        }
        directionsUrl={directionsUrl}
        isRetrying={isRetrying}
        isDisabled={isBusy}
        onTryAnother={onTryAnother}
        showHowToPlay={!secondaryRecommendation}
      />
    </>
  );

  return (
    <section
      aria-labelledby="activity-title"
      className="flex min-h-[calc(100svh-6.5rem)] flex-col pt-3 pb-[72px]"
    >
      {secondaryRecommendation ? (
        <>
          {carouselMarkup}
          {sharedOutingContent}
        </>
      ) : (
        <Dialog key={recommendation.missionId}>
          {carouselMarkup}
          {sharedOutingContent}
        </Dialog>
      )}
    </section>
  );
}

export { ActivityResult, type ActivityResultProps };
