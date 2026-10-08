"use client";

import { useEffect, useId, type ComponentProps } from "react";

import { CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type PlannerCalendarDayButtonProps = ComponentProps<typeof CalendarDayButton>;

export const PLANNER_SELECTED_DAY_CLASSES =
  "data-[selected-single=true]:bg-[#F0B6A31F] data-[selected-single=true]:text-zinc-900 data-[selected-single=true]:font-bold data-[selected-single=true]:border data-[selected-single=true]:border-[#E4633C]/40 data-[selected-single=true]:hover:bg-[#F0B6A31F] data-[selected-single=true]:[&>span]:opacity-100";

/** Restores focus movement expected by React DayPicker without changing the UI primitive. */
export function PlannerCalendarDayButton(
  props: PlannerCalendarDayButtonProps,
) {
  const generatedId = useId();
  const buttonId = props.id ?? generatedId;

  useEffect(() => {
    if (props.modifiers.focused) document.getElementById(buttonId)?.focus();
  }, [buttonId, props.modifiers.focused]);

  return (
    <CalendarDayButton
      {...props}
      id={buttonId}
      className={cn(props.className, PLANNER_SELECTED_DAY_CLASSES)}
    />
  );
}

