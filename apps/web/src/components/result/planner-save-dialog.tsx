"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { PlannerCalendarDayButton } from "@/components/planner/planner-calendar-day-button";

/**
 * Properties for the `PlannerSaveDialog` date selection and scheduling modal.
 */
type PlannerSaveDialogProps = {
  /** The recommendation to be scheduled in the planner. */
  recommendation: Recommendation;
  /** Optional initial date key (YYYY-MM-DD) pre-selected on initial mount. */
  initialDateKey?: string;
  /** Optional reference date override for deterministic testing. */
  now?: Date;
  /** Controlled open state for external trigger components. */
  open?: boolean;
  /** Callback fired when the open state is updated. */
  onOpenChange?: (open: boolean) => void;
  /** Optional custom trigger node or button. */
  trigger?: React.ReactNode | null;
  /** Callback fired with the selected dateKey once successfully scheduled. */
  onSaved?: (dateKey: string) => void;
};

/**
 * Generates a unique identifier string for a newly created planned activity record.
 */
function newPlannerId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Date picker modal allowing parents to schedule an activity mission on a specific date.
 *
 * Enforces the allowable 365-day future planning window, highlights Victorian school
 * holiday periods, and persists the scheduled activity to browser local storage.
 * On success, displays a confirmation modal with the formatted scheduled date.
 *
 * @param props - Component configuration including recommendation data and callbacks.
 * @returns The rendered planner scheduling dialog and confirmation alert.
 */
export function PlannerSaveDialog({
  recommendation,
  initialDateKey,
  now,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,

  onSaved,
}: PlannerSaveDialogProps) {
  const currentDate = useDashboardDate();
  const referenceDate = now ?? currentDate;
  const todayKey = localDateKey(referenceDate);
  const prefill = readPlannableDateParam(initialDateKey ?? null, referenceDate);
  const [selectedDate, setSelectedDate] = useState(
    () => parseLocalDateKey(prefill ?? todayKey) ?? referenceDate,
  );
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (nextOpen: boolean) => {
    if (isControlled) {
      setControlledOpen?.(nextOpen);
    } else {
      setUncontrolledOpen(nextOpen);
    }
  };

  const [error, setError] = useState("");
  const [savedDate, setSavedDate] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
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
      onSaved?.(plannedDate);
      setError("");
      setOpen(false);
      setAlertOpen(true);
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
        {trigger !== null && (
          trigger !== undefined ? (
            <DialogTrigger render={<button type="button" />}>
              {trigger}
            </DialogTrigger>
          ) : (
            <DialogTrigger
              render={<Button type="button" size="lg" variant="outline" />}
              className="h-12 w-full rounded-full border-[#93AB63] bg-white px-6 text-base font-bold text-[#728A46] hover:bg-[#EEF2E8] hover:text-[#728A46]"
            >
              <CalendarPlus />
              Save to planner (do it later)
            </DialogTrigger>
          )
        )}
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
            components={{ DayButton: PlannerCalendarDayButton }}
            defaultMonth={selectedDate}
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
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:max-w-xs shadow-lg">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-base font-bold text-zinc-900">
              Saved to Planner
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-600">
              Saved to your planner for{" "}
              {parseLocalDateKey(savedDate)?.toLocaleDateString("en-AU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="h-10 w-full rounded-full bg-[#93AB63] font-semibold text-white hover:bg-[#819953]"
              onClick={() => setAlertOpen(false)}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
