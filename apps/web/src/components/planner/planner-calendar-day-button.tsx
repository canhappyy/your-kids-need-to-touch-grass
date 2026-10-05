"use client";

import { useEffect, useId, type ComponentProps } from "react";

import { CalendarDayButton } from "@/components/ui/calendar";

type PlannerCalendarDayButtonProps = ComponentProps<typeof CalendarDayButton>;

/** Restores focus movement expected by React DayPicker without changing the UI primitive. */
export function PlannerCalendarDayButton(
  props: PlannerCalendarDayButtonProps,
) {
  const generatedId = useId();
  const buttonId = props.id ?? generatedId;

  useEffect(() => {
    if (props.modifiers.focused) document.getElementById(buttonId)?.focus();
  }, [buttonId, props.modifiers.focused]);

  return <CalendarDayButton {...props} id={buttonId} />;
}
