"use client";

import { useEffect, useState } from "react";

/**
 * Interface contract abstracting timers and browser visibility/focus event listeners.
 * Allows deterministic clock advancement and event triggering during unit testing.
 */
export type DashboardDateEnvironment = {
  /** Retrieves the current clock date. */
  now: () => Date;
  /** Schedules a timer callback after a millisecond delay. */
  schedule: (callback: () => void, delay: number) => unknown;
  /** Cancels a previously scheduled timer. */
  cancel: (timer: unknown) => void;
  /** Registers a window focus event listener, returning an unregister cleanup function. */
  addFocusListener: (callback: () => void) => () => void;
  /** Registers a document visibilitychange event listener, returning an unregister cleanup function. */
  addVisibilityListener: (callback: () => void) => () => void;
  /** Returns whether the document is currently hidden (in background or device locked). */
  isHidden: () => boolean;
};

/**
 * Calculates the exact duration in milliseconds from a reference time until just after the next local midnight.
 *
 * Adds a small 50ms buffer past 00:00:00 to guarantee the clock has decisively crossed into the new calendar date.
 *
 * @param now - Reference timestamp.
 * @returns Milliseconds remaining until the next local day rollover (minimum 50ms).
 */
export function millisecondsUntilNextLocalDay(now: Date): number {
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 0, 50);
  return Math.max(50, nextDay.getTime() - now.getTime());
}

/**
 * Constructs a real browser environment backed by standard window and document APIs.
 *
 * @returns Production `DashboardDateEnvironment` implementation.
 */
function browserEnvironment(): DashboardDateEnvironment {
  return {
    now: () => new Date(),
    schedule: (callback, delay) => window.setTimeout(callback, delay),
    cancel: (timer) => window.clearTimeout(timer as number),
    addFocusListener: (callback) => {
      window.addEventListener("focus", callback);
      return () => window.removeEventListener("focus", callback);
    },
    addVisibilityListener: (callback) => {
      document.addEventListener("visibilitychange", callback);
      return () => document.removeEventListener("visibilitychange", callback);
    },
    isHidden: () => document.hidden,
  };
}

/**
 * Monitors calendar date changes triggered by midnight day rollover, tab focus, or device wakeup.
 *
 * How this function works:
 * 1. Midnight Timer (`scheduleNextDay`):
 *    Calculates milliseconds until 00:00:00.050 tomorrow and schedules a callback.
 * 2. Tab Return & Focus (`addFocusListener` & `addVisibilityListener`):
 *    If the user leaves the tab open overnight on a tablet or mobile device, mobile browsers pause timers.
 *    When the user unlocks their screen or returns to the browser tab, the visibility/focus handlers immediately
 *    re-check the clock and invoke `onChange` with the new date.
 * 3. Cleanup:
 *    Cancels any pending setTimeout timer and removes all window event listeners upon unmount.
 *
 * @param onChange - Callback invoked with the updated `Date` whenever the active calendar day changes.
 * @param environment - Optional environment implementation for testing. Defaults to `browserEnvironment()`.
 * @returns Cleanup function that tears down all scheduled timers and event listeners.
 */
export function watchDashboardDate(
  onChange: (date: Date) => void,
  environment: DashboardDateEnvironment = browserEnvironment(),
): () => void {
  let timer: unknown;

  // Schedules a timer to fire right after the next local midnight
  const scheduleNextDay = (current: Date) => {
    if (timer !== undefined) environment.cancel(timer);
    timer = environment.schedule(
      refresh,
      millisecondsUntilNextLocalDay(current),
    );
  };

  // Checks the clock, calls the listener, and reschedules for the following midnight
  const refresh = () => {
    const current = environment.now();
    onChange(current);
    scheduleNextDay(current);
  };

  // Initial schedule
  scheduleNextDay(environment.now());

  // Listen for user returning to tab or waking up phone
  const removeFocusListener = environment.addFocusListener(refresh);
  const removeVisibilityListener = environment.addVisibilityListener(() => {
    if (!environment.isHidden()) refresh();
  });

  return () => {
    if (timer !== undefined) environment.cancel(timer);
    removeFocusListener();
    removeVisibilityListener();
  };
}

/**
 * Custom hook providing a reactive current `Date` that automatically advances when local midnight passes
 * or when the user returns to the browser tab on a new day.
 *
 * Prevents stale dates from persisting when parents leave the application open on a device.
 *
 * @returns The active local `Date` instance.
 */
export function useDashboardDate(): Date {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => watchDashboardDate(setCurrentDate), []);

  return currentDate;
}
