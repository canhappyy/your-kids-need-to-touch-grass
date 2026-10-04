"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDashboardDate } from "@/hooks/use-dashboard-date";
import {
  getPlanningWindow,
  isPlannableDate,
  localDateKey,
  parseLocalDateKey,
  readPlannableDateParam,
} from "@/lib/planner-dates";
import {
  PLANNING_WINDOW_MESSAGE,
  savePlannedActivity,
} from "@/lib/planned-activities";
import { plannedActivityFromRecommendation } from "@/lib/planner-recommendation";
import type { Recommendation } from "@/types/recommendation";

type PlannerSaveDialogProps = {
  recommendation: Recommendation;
  initialDateKey?: string;
  now?: Date;
};

function newPlannerId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function PlannerSaveDialog({
  recommendation,
  initialDateKey,
  now,
}: PlannerSaveDialogProps) {
  const currentDate = useDashboardDate();
  const referenceDate = now ?? currentDate;
  const todayKey = localDateKey(referenceDate);
  const prefill = readPlannableDateParam(initialDateKey ?? null, referenceDate);
  const [selectedDate, setSelectedDate] = useState(
    () => parseLocalDateKey(prefill ?? todayKey) ?? referenceDate,
  );
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [savedDate, setSavedDate] = useState("");
  const { minDateKey, maxDateKey } = getPlanningWindow(referenceDate);
  const minDate = parseLocalDateKey(minDateKey) ?? referenceDate;
  const maxDate = parseLocalDateKey(maxDateKey) ?? referenceDate;

  const handleSave = () => {
    const plannedDate = localDateKey(selectedDate);
    if (!isPlannableDate(plannedDate, referenceDate)) {
      setError(PLANNING_WINDOW_MESSAGE);
      return;
    }

    try {
      const activity = plannedActivityFromRecommendation(
        recommendation,
        plannedDate,
        newPlannerId(),
        referenceDate,
      );
      savePlannedActivity(activity, window.localStorage, referenceDate);
      setSavedDate(plannedDate);
      setError("");
      setOpen(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error &&
          saveError.message === PLANNING_WINDOW_MESSAGE
          ? PLANNING_WINDOW_MESSAGE
          : "Planned activity could not be saved. Browser storage may be unavailable or damaged.",
      );
    }
  };

  return (
    <div className="space-y-2">
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) setError("");
        }}
      >
        <DialogTrigger
          render={<Button type="button" size="lg" variant="outline" />}
          className="h-12 w-full rounded-full border-[#93AB63] bg-white px-6 text-base font-bold text-[#728A46] hover:bg-[#EEF2E8] hover:text-[#728A46]"
        >
          <CalendarPlus />
          Save to planner (do it later)
        </DialogTrigger>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a date</DialogTitle>
            <DialogDescription>
              Plan this activity from today up to 365 days ahead.
            </DialogDescription>
          </DialogHeader>
          <Calendar
            aria-label="Choose a planner date"
            className="mx-auto"
            disabled={{ before: minDate, after: maxDate }}
            mode="single"
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
                setError("");
              }
            }}
            selected={selectedDate}
          />
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              className="h-11 rounded-full bg-[#93AB63] text-white hover:bg-[#819953]"
              onClick={handleSave}
              type="button"
            >
              Confirm planner save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {savedDate && (
        <p role="status" className="text-center text-sm text-zinc-600">
          Saved to your planner for{" "}
          {parseLocalDateKey(savedDate)?.toLocaleDateString("en-AU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      )}
    </div>
  );
}
