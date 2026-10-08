"use client";

import { Bookmark, CalendarPlus, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type SaveOptionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveToBacklog: () => void;
  onOpenPlanner: () => void;
  isBacklogSaved?: boolean;
  isPlannerSaved?: boolean;
  activityTitle: string;
};

/**
 * Small modal dialog prompting parents to choose between saving an activity
 * to their backlog or scheduling it in the planner.
 */
export function SaveOptionsDialog({
  open,
  onOpenChange,
  onSaveToBacklog,
  onOpenPlanner,
  isBacklogSaved = false,
  isPlannerSaved = false,
  activityTitle,
}: SaveOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl bg-white p-5 sm:max-w-xs ring-0 border border-zinc-200/80 shadow-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base font-bold text-zinc-900">
            Save activity
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 truncate">
            {activityTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2.5">
          {/* Save to Backlog option */}
          <button
            type="button"
            onClick={onSaveToBacklog}
            disabled={isBacklogSaved}
            className="group flex w-full items-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 text-left transition hover:border-[#93AB63] hover:bg-[#F4F7E9]/60 disabled:opacity-75 disabled:cursor-default"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#93AB63]/15 text-[#728A46] transition group-hover:scale-105">
              {isBacklogSaved ? (
                <Check className="size-5" />
              ) : (
                <Bookmark className="size-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">
                {isBacklogSaved ? "Saved to Backlog" : "Save to Backlog"}
              </p>
              <p className="text-xs text-zinc-500">
                {isBacklogSaved
                  ? "Available in your saved list"
                  : "Save for whenever you're ready"}
              </p>
            </div>
          </button>

          {/* Save to Planner option */}
          <button
            type="button"
            onClick={onOpenPlanner}
            className="group flex w-full items-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 text-left transition hover:border-[#E4633C] hover:bg-[#FFF8E8]/60"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E4633C]/15 text-[#E4633C] transition group-hover:scale-105">
              {isPlannerSaved ? (
                <Check className="size-5" />
              ) : (
                <CalendarPlus className="size-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">
                {isPlannerSaved ? "Scheduled in Planner" : "Save to Planner"}
              </p>
              <p className="text-xs text-zinc-500">
                {isPlannerSaved
                  ? "Date scheduled in planner"
                  : "Pick a specific date to play"}
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
