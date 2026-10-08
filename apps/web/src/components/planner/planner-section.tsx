"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ScreenHeader } from "@/components/layout/screen-header";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardDate } from "@/hooks/use-dashboard-date";
import { usePlannedActivities } from "@/hooks/use-planned-activities";
import {
  localDateKey,
  parseLocalDateKey,
  shiftLocalDateKey,
  startOfLocalWeek,
} from "@/lib/planner-dates";
import { movePlannerPeriod, plannerMonth } from "@/lib/planner-navigation";
import { cn } from "@/lib/utils";
import type { PlannerView } from "@/types/planner";
import { MonthPlannerView } from "./month-planner-view";
import { PlannerDateDetails } from "./planner-date-details";
import { WeekPlannerView } from "./week-planner-view";

/**
 * Top-level container component for the Activity Planner feature.
 *
 * Responsibilities:
 * 1. Synchronizes planned activities via `usePlannedActivities` hook (loading, error, deleting).
 * 2. Manages active display view ("month" vs. "week") using tab switcher.
 * 3. Handles period navigation (Previous / Next month or week, plus "Jump to today" shortcut).
 * 4. In Month View: renders side-by-side grid and details panel on desktop, stacking gracefully on mobile.
 * 5. In Week View: renders a 7-day chronological agenda with inline "Add activity" actions.
 *
 * @returns The rendered activity planner section.
 */
export function PlannerSection() {
  const router = useRouter();
  // Get active local reference date
  const today = useDashboardDate();

  // Load planned activities and deletion handler from local storage
  const { activities, loading, error, remove } = usePlannedActivities(today);

  // Active view mode: "month" or "week"
  const [view, setView] = useState<PlannerView>("month");

  // Selected date (anchored at noon to avoid timezone daylight saving edge cases)
  const [selectedDate, setSelectedDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12),
  );

  // First day of currently viewed month
  const [displayedMonth, setDisplayedMonth] = useState(() =>
    plannerMonth(today),
  );

  // Human-readable header label for active period (e.g., "October 2026" or "5 Oct – 11 Oct 2026")
  const periodLabel = useMemo(() => {
    if (view === "month") {
      return displayedMonth.toLocaleDateString("en-AU", {
        month: "long",
        year: "numeric",
      });
    }
    const start = startOfLocalWeek(selectedDate);
    const endKey = shiftLocalDateKey(localDateKey(start), 6);
    const end = parseLocalDateKey(endKey) ?? start;
    return `${start.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
    })} – ${end.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }, [displayedMonth, selectedDate, view]);

  // Navigate forward or backward in time (+1 or -1 month/week)
  const movePeriod = (amount: number) => {
    const next = movePlannerPeriod(view, displayedMonth, selectedDate, amount);
    setDisplayedMonth(next.displayedMonth);
    setSelectedDate(next.selectedDate);
  };

  // Reset focus back to today's date
  const jumpToToday = () => {
    const next = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
    );
    setSelectedDate(next);
    setDisplayedMonth(plannerMonth(next));
  };

  // Select a new date and align the displayed month
  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setDisplayedMonth(plannerMonth(date));
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <ScreenHeader title="Activity planner" />


      {loading ? (
        <div aria-label="Loading activity planner" className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50 ring-0">
          <CardContent role="alert" className="text-sm text-red-800">
            {error}
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            "items-start gap-5",
            view === "month"
              ? "grid lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.75fr)]"
              : "block w-full",
          )}
        >
          <Card className="border-[#93AB63]/60 bg-white/55 shadow-sm ring-0">
            <CardContent className="space-y-4">
              <Tabs
                value={view}
                onValueChange={(value) => setView(value as PlannerView)}
              >
                <TabsList className="grid h-10 w-full grid-cols-2 rounded-full bg-[#EEF2E8]">
                  <TabsTrigger className="rounded-full" value="month">
                    Month
                  </TabsTrigger>
                  <TabsTrigger className="rounded-full" value="week">
                    Week
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center justify-between gap-2">
                <Button
                  aria-label="Previous period"
                  onClick={() => movePeriod(-1)}
                  size="icon"
                  variant="outline"
                >
                  <ChevronLeft />
                </Button>
                <div className="text-center">
                  <p className="font-semibold text-zinc-800">{periodLabel}</p>
                  <button
                    type="button"
                    onClick={jumpToToday}
                    className="text-xs font-semibold text-[#728A46] hover:underline"
                  >
                    Jump to today
                  </button>
                </div>
                <Button
                  aria-label="Next period"
                  onClick={() => movePeriod(1)}
                  size="icon"
                  variant="outline"
                >
                  <ChevronRight />
                </Button>
              </div>

              {view === "month" ? (
                <MonthPlannerView
                  activities={activities}
                  displayedMonth={displayedMonth}
                  selectedDate={selectedDate}
                  onMonthChange={(month) => {
                    setDisplayedMonth(month);
                    setSelectedDate(month);
                  }}
                  onSelectDate={selectDate}
                />
              ) : (
                <WeekPlannerView
                  activities={activities}
                  selectedDate={selectedDate}
                  today={today}
                  onSelectDate={selectDate}
                  onAddActivity={(date) =>
                    router.push(`/?planDate=${localDateKey(date)}`)
                  }
                  onRemoveActivity={remove}
                />
              )}
            </CardContent>
          </Card>

          {view === "month" && (
            <PlannerDateDetails
              activities={activities}
              selectedDate={selectedDate}
              today={today}
              onAdd={() =>
                router.push(`/?planDate=${localDateKey(selectedDate)}`)
              }
              onRemove={remove}
            />
          )}
        </div>
      )}
    </div>
  );
}
