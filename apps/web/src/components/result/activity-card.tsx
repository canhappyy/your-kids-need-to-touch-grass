"use client";

import { useState } from "react";
import Image from "next/image";
import { RotateCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getEquipmentList, getMissionSteps } from "@/lib/mission-instructions";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/types/recommendation";

import { ActivityDetails } from "./activity-details";

export type ActivityCardProps = {
  recommendation: Recommendation;
  formattedDuration: string;
  formattedTotalDuration: string;
  formattedCommuteDuration: string | null;
  locationLabel: string;
  isHomeBased: boolean;
};

/**
 * Interactive card displaying activity details on the front and instructions on the back,
 * flipping smoothly with a 3D animation while preserving identical dimensions before and after.
 */
export function ActivityCard({
  recommendation,
  formattedDuration,
  formattedTotalDuration,
  formattedCommuteDuration,
  locationLabel,
  isHomeBased,
}: ActivityCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const steps = getMissionSteps(recommendation.instructionText);
  const equipmentItems = getEquipmentList(recommendation.equipmentNeeded);

  return (
    <div className="group relative mt-6 w-full perspective-1000">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isFlipped}
        aria-label={
          isFlipped
            ? "Activity instructions. Tap or press enter to flip back to details."
            : "Activity details. Tap or press enter to flip card for how to play instructions."
        }
        onClick={() => setIsFlipped((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsFlipped((prev) => !prev);
          }
        }}
        className={cn(
          "relative w-full cursor-pointer transition-transform duration-500 ease-in-out transform-style-3d outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] focus-visible:ring-offset-4 rounded-xl",
          isFlipped && "rotate-y-180",
        )}
      >
        {/* Front Face: Activity Details */}
        <div className="w-full backface-hidden">
          <Card className="min-h-[380px] sm:min-h-[400px] flex flex-col justify-between border border-[#93AB63]/60 bg-white/70 shadow-sm ring-0 transition-all group-hover:border-[#93AB63] group-hover:shadow-md">
            <CardContent className="flex flex-1 flex-col justify-between p-5 sm:p-6">
              <div>
                <ActivityDetails
                  formattedCommuteDuration={formattedCommuteDuration}
                  formattedDuration={formattedDuration}
                  formattedTotalDuration={formattedTotalDuration}
                  isHomeBased={isHomeBased}
                  locationLabel={locationLabel}
                  weather={recommendation.weather}
                />
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-[#93AB63]/30 bg-[#93AB63]/10 px-3 py-2 text-xs font-semibold text-[#5b7234] transition-colors group-hover:bg-[#93AB63]/20">
                <RotateCw
                  aria-hidden="true"
                  className="size-3.5 text-[#728A46] transition-transform duration-300 group-hover:rotate-45"
                />
                <span>Tap card to see How to Play instructions</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back Face: Activity Instructions */}
        <div className="absolute inset-0 h-full w-full backface-hidden rotate-y-180">
          <Card className="h-full flex flex-col border border-[#93AB63]/60 bg-[#FDF6EA] shadow-sm ring-0 transition-all group-hover:border-[#93AB63] group-hover:shadow-md">
            <CardContent className="flex h-full flex-col p-5 sm:p-6 overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {recommendation.iconFile ? (
                    <Image
                      src={`/activity-icons/${recommendation.iconFile}`}
                      alt=""
                      className="size-10 shrink-0 object-contain"
                      height={40}
                      width={40}
                    />
                  ) : null}
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold leading-tight text-zinc-900">
                      How to Play
                    </h3>
                    <p className="truncate text-xs font-medium text-zinc-600">
                      {recommendation.title}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto overscroll-contain space-y-4 py-2 pr-1 text-left text-zinc-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Equipment Needed
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {equipmentItems.length > 0 ? (
                      equipmentItems.map((item, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-[#93AB63]/40 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-800 shadow-2xs"
                        >
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-dashed border-zinc-300 bg-white/60 px-2.5 py-0.5 text-xs font-medium text-zinc-500"
                      >
                        No equipment needed
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Instructions
                  </h4>
                  {steps.length ? (
                    <ol className="list-decimal space-y-2.5 pl-4 text-sm leading-relaxed text-zinc-800 marker:font-semibold marker:text-[#93AB63]">
                      {steps.map((step, index) => (
                        <li key={index} className="pl-1">
                          {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-zinc-600">
                      Instructions unavailable for this activity.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-[#93AB63]/30 bg-[#93AB63]/10 px-3 py-1.5 text-xs font-semibold text-[#5b7234] transition-colors group-hover:bg-[#93AB63]/20">
                <RotateCw
                  aria-hidden="true"
                  className="size-3.5 text-[#728A46]"
                />
                <span>Tap card to return to details</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
