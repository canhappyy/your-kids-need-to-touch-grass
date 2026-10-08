"use client";

import { useEffect, useId, type ComponentProps } from "react";

import { CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

/**
 * Component props for the PlannerCalendarDayButton, extending React DayPicker's calendar day button props.
 */
type PlannerCalendarDayButtonProps = ComponentProps<typeof CalendarDayButton>;

/**
 * Custom styling classes applied to the currently selected calendar day in the planner.
 *
 * Provides a warm terracotta tint (`#F0B6A31F`) with a refined border (`#E4633C`/40)
 * and high-contrast bold dark zinc text, matching the planner's design system.
 */
export const PLANNER_SELECTED_DAY_CLASSES =
  "data-[selected-single=true]:bg-[#F0B6A31F] data-[selected-single=true]:text-zinc-900 data-[selected-single=true]:font-bold data-[selected-single=true]:border data-[selected-single=true]:border-[#E4633C]/40 data-[selected-single=true]:hover:bg-[#F0B6A31F] data-[selected-single=true]:[&>span]:opacity-100";

/**
 * Custom calendar day button component for the activity planner.
 *
 * This component wraps shadcn's underlying `CalendarDayButton` primitive to achieve two key goals:
 * 1. Restores keyboard accessibility focus navigation expected by React DayPicker when arrowing
 *    between calendar days.
 * 2. Injects the planner-specific terracotta active theme styling (`PLANNER_SELECTED_DAY_CLASSES`)
 *    without mutating or modifying the global shadcn UI calendar component.
 *
 * @param props - Day picker button attributes including modifiers, selected status, and disabled state.
 * @returns The rendered accessible calendar day button.
 */
export function PlannerCalendarDayButton(
  props: PlannerCalendarDayButtonProps,
) {
  // Generate a stable unique HTML element ID if not explicitly provided
  const generatedId = useId();
  const buttonId = props.id ?? generatedId;

  // Restore keyboard focus movement when React DayPicker focuses this day via keyboard navigation
  useEffect(() => {
    if (props.modifiers.focused) {
      document.getElementById(buttonId)?.focus();
    }
  }, [buttonId, props.modifiers.focused]);

  return (
    <CalendarDayButton
      {...props}
      id={buttonId}
      className={cn(props.className, PLANNER_SELECTED_DAY_CLASSES)}
    />
  );
}


