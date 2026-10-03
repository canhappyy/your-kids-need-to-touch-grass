import { DAILY_GOAL_MINUTES } from "@/lib/dashboard-stats";
import type { DashboardDay } from "@/types/dashboard";

type WeeklyActivityChartProps = {
  days: DashboardDay[];
};

const CHART_TOP = 24;
const CHART_HEIGHT = 156;
const CHART_BOTTOM = CHART_TOP + CHART_HEIGHT;
const BAR_WIDTH = 44;
const BAR_GAP = 28;
const CHART_LEFT = 38;

/** Accessible seven-day activity chart with a 60-minute target reference. */
export function WeeklyActivityChart({ days }: WeeklyActivityChartProps) {
  const maximumMinutes = Math.max(
    DAILY_GOAL_MINUTES,
    ...days.map((day) => day.minutes),
  );
  const targetY =
    CHART_BOTTOM - (DAILY_GOAL_MINUTES / maximumMinutes) * CHART_HEIGHT;
  const description = `60-minute daily target. ${days
    .map((day) => {
      const weekday = new Intl.DateTimeFormat("en-AU", {
        weekday: "short",
      }).format(day.date);
      return `${weekday}: ${day.minutes} minutes`;
    })
    .join("; ")}.`;

  return (
    <figure className="mt-5">
      <svg
        aria-describedby="weekly-activity-description"
        aria-label="Weekly active minutes chart"
        className="h-auto w-full overflow-visible"
        role="img"
        viewBox="0 0 560 230"
      >
        <title>Weekly active minutes chart</title>
        <desc id="weekly-activity-description">{description}</desc>
        <line
          stroke="#E4633C"
          strokeDasharray="6 5"
          strokeWidth="2"
          x1="24"
          x2="544"
          y1={targetY}
          y2={targetY}
        />
        <text
          fill="#C44F2D"
          fontSize="12"
          textAnchor="end"
          x="540"
          y={Math.max(12, targetY - 6)}
        >
          60-minute target
        </text>

        {days.map((day, index) => {
          const height = (day.minutes / maximumMinutes) * CHART_HEIGHT;
          const x = CHART_LEFT + index * (BAR_WIDTH + BAR_GAP);
          const weekday = new Intl.DateTimeFormat("en-AU", {
            weekday: "short",
          }).format(day.date);

          return (
            <g aria-label={`${weekday} ${day.minutes} minutes`} key={day.dateKey}>
              <rect
                fill={day.metGoal ? "#93AB63" : "#7B8FD6"}
                height={height}
                rx="8"
                width={BAR_WIDTH}
                x={x}
                y={CHART_BOTTOM - height}
              />
              <text
                fill="#3F3F46"
                fontSize="12"
                fontWeight="600"
                textAnchor="middle"
                x={x + BAR_WIDTH / 2}
                y={Math.max(16, CHART_BOTTOM - height - 7)}
              >
                {day.minutes}
              </text>
              <text
                fill="#71717A"
                fontSize="12"
                textAnchor="middle"
                x={x + BAR_WIDTH / 2}
                y="205"
              >
                {weekday}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 text-xs text-zinc-500">
        Active minutes recorded for each local calendar day.
      </figcaption>
    </figure>
  );
}

export type { WeeklyActivityChartProps };
