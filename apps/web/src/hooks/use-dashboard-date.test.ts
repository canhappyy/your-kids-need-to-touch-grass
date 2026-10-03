import { describe, expect, it, vi } from "vitest";
import {
  millisecondsUntilNextLocalDay,
  watchDashboardDate,
  type DashboardDateEnvironment,
} from "./use-dashboard-date";

function environment(now: Date) {
  let current = now;
  let scheduled: (() => void) | undefined;
  let focus: (() => void) | undefined;
  let visibility: (() => void) | undefined;
  let hidden = false;
  const cancel = vi.fn();

  const value: DashboardDateEnvironment = {
    now: () => current,
    schedule: (callback) => {
      scheduled = callback;
      return 1;
    },
    cancel,
    addFocusListener: (callback) => {
      focus = callback;
      return () => undefined;
    },
    addVisibilityListener: (callback) => {
      visibility = callback;
      return () => undefined;
    },
    isHidden: () => hidden,
  };

  return {
    value,
    setNow: (next: Date) => {
      current = next;
    },
    runScheduled: () => scheduled?.(),
    runFocus: () => focus?.(),
    runVisibility: () => visibility?.(),
    setHidden: (next: boolean) => {
      hidden = next;
    },
    cancel,
  };
}

describe("dashboard date watcher", () => {
  it("calculates the delay to the next local day", () => {
    expect(
      millisecondsUntilNextLocalDay(new Date(2026, 9, 3, 23, 59, 30)),
    ).toBe(30_050);
  });

  it("updates at midnight and when a later day regains focus", () => {
    const fake = environment(new Date(2026, 9, 3, 23, 59, 30));
    const onChange = vi.fn();
    const stop = watchDashboardDate(onChange, fake.value);

    fake.setNow(new Date(2026, 9, 4, 0, 0, 1));
    fake.runScheduled();
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 4, 0, 0, 1));

    fake.setNow(new Date(2026, 9, 5, 9));
    fake.runFocus();
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 5, 9));

    fake.setHidden(true);
    fake.setNow(new Date(2026, 9, 6, 9));
    fake.runVisibility();
    expect(onChange).not.toHaveBeenCalledWith(new Date(2026, 9, 6, 9));

    fake.setHidden(false);
    fake.runVisibility();
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 6, 9));

    stop();
    expect(fake.cancel).toHaveBeenCalled();
  });
});
