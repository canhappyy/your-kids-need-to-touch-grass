"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
import type { PlannerView } from "@/types/planner";
import { MonthPlannerView } from "./month-planner-view";
import { PlannerDateDetails } from "./planner-date-details";
import { WeekPlannerView } from "./week-planner-view";

function monthFromDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function shiftMonth(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

export function PlannerSection() {
  const router = useRouter();
  const today = useDashboardDate();
  const { activities, loading, error, remove } = usePlannedActivities(today);
  const [view, setView] = useState<PlannerView>("month");
  const [selectedDate, setSelectedDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12),
  );
  const [displayedMonth, setDisplayedMonth] = useState(() => monthFromDate(today));

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

  const movePeriod = (amount: number) => {
    if (view === "month") {
      const next = shiftMonth(displayedMonth, amount);
      setDisplayedMonth(next);
      setSelectedDate(next);
      return;
    }
    const nextKey = shiftLocalDateKey(localDateKey(selectedDate), amount * 7);
    setSelectedDate(parseLocalDateKey(nextKey) ?? selectedDate);
  };

  const jumpToToday = () => {
    const next = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    setSelectedDate(next);
    setDisplayedMonth(monthFromDate(next));
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setDisplayedMonth(monthFromDate(date));
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <header className="space-y-3 text-center sm:text-left">
        <Image
          src="/playgo&co.svg"
          alt="PlayGo & Co"
          width={180}
          height={36}
          priority
          className="mx-auto h-10 w-auto sm:mx-0"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Activity planner
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Plan screen-free family time around Victorian holidays.
          </p>
        </div>
      </header>

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
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.75fr)]">
          <Card className="border-[#93AB63]/60 bg-white/55 shadow-sm ring-0">
            <CardContent className="space-y-4">
              <Tabs
                value={view}
                onValueChange={(value) => setView(value as PlannerView)}
              >
                <TabsList className="grid h-10 w-full grid-cols-2 bg-[#EEF2E8]">
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
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
                />
              )}
            </CardContent>
          </Card>

          <PlannerDateDetails
            activities={activities}
            selectedDate={selectedDate}
            today={today}
            onAdd={() =>
              router.push(`/?planDate=${localDateKey(selectedDate)}`)
            }
            onRemove={remove}
          />
        </div>
      )}
    </div>
  );
}
