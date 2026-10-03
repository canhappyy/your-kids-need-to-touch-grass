"use client";

import { useEffect, useState } from "react";

export type DashboardDateEnvironment = {
  now: () => Date;
  schedule: (callback: () => void, delay: number) => unknown;
  cancel: (timer: unknown) => void;
  addFocusListener: (callback: () => void) => () => void;
  addVisibilityListener: (callback: () => void) => () => void;
  isHidden: () => boolean;
};

/** Returns milliseconds until just after the next local midnight. */
export function millisecondsUntilNextLocalDay(now: Date): number {
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 0, 50);
  return Math.max(50, nextDay.getTime() - now.getTime());
}

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

/** Watches local-day rollover and browser return events. */
export function watchDashboardDate(
  onChange: (date: Date) => void,
  environment: DashboardDateEnvironment = browserEnvironment(),
): () => void {
  let timer: unknown;

  const scheduleNextDay = (current: Date) => {
    if (timer !== undefined) environment.cancel(timer);
    timer = environment.schedule(
      refresh,
      millisecondsUntilNextLocalDay(current),
    );
  };

  const refresh = () => {
    const current = environment.now();
    onChange(current);
    scheduleNextDay(current);
  };

  scheduleNextDay(environment.now());
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

/** Supplies a current date that refreshes after local midnight or tab return. */
export function useDashboardDate(): Date {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => watchDashboardDate(setCurrentDate), []);

  return currentDate;
}
