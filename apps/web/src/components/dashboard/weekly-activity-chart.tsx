import { DAILY_GOAL_MINUTES } from "@/lib/dashboard-stats";
import type { DashboardDay } from "@/types/dashboard";

type WeeklyActivityChartProps = {
  days: DashboardDay[];
};

const CHART_TOP = 8;
const CHART_HEIGHT = 62;
const CHART_BOTTOM = CHART_TOP + CHART_HEIGHT;
const BAR_WIDTH = 26;
const BAR_STEP = 48;
const CHART_LEFT = 9;

/** Accessible Monday-to-Sunday chart with an uninterrupted goal line. */
export function WeeklyActivityChart({ days }: WeeklyActivityChartProps) {
  const maximumMinutes = Math.max(
    DAILY_GOAL_MINUTES,
    ...days.map((day) => day.minutes),
  );
  const targetY =
    CHART_BOTTOM - (DAILY_GOAL_MINUTES / maximumMinutes) * CHART_HEIGHT;
  const dayDetails = days.map((day) => {
    const weekday = new Intl.DateTimeFormat("en-AU", {
      weekday: "short",
    }).format(day.date);
    return { ...day, weekday };
  });
  const description =
    "60-minute daily guideline. " +
    dayDetails
      .map(({ weekday, minutes, isFuture }) =>
        isFuture
          ? weekday + ": not yet occurred"
          : weekday + ": " + minutes + " minutes",
      )
      .join("; ") +
    ".";

  return (
    <figure aria-labelledby="weekly-chart-heading">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-800" id="weekly-chart-heading">
          Weekly active minutes
        </h2>
        <span className="text-[10px] text-zinc-500">Dashed line = 60 min</span>
      </div>
      <svg
        aria-describedby="weekly-activity-description"
        aria-label="Weekly active minutes chart"
        className="h-auto w-full overflow-visible"
        role="img"
        viewBox="0 0 332 94"
      >
        <title>Weekly active minutes chart</title>
        <desc id="weekly-activity-description">{description}</desc>
        <line
          stroke="#E4633C"
          strokeDasharray="4 4"
          strokeWidth="1.5"
          x1="4"
          x2="328"
          y1={targetY}
          y2={targetY}
        />

        {dayDetails.map((day, index) => {
          const height = (day.minutes / maximumMinutes) * CHART_HEIGHT;
          const x = CHART_LEFT + index * BAR_STEP;
          const showBar = day.minutes > 0 && !day.isFuture;

          return (
            <g
              aria-label={
                day.isFuture
                  ? day.weekday + " not yet occurred"
                  : day.weekday + " " + day.minutes + " minutes"
              }
              key={day.dateKey}
            >
              {showBar ? (
                <rect
                  data-chart-bar="true"
                  fill={day.metGoal ? "#93AB63" : "#7B8FD6"}
                  height={height}
                  rx="5"
                  width={BAR_WIDTH}
                  x={x}
                  y={CHART_BOTTOM - height}
                />
              ) : null}
              <text
                fill="#52525B"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
                x={x + BAR_WIDTH / 2}
                y="87"
              >
                {day.weekday}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export type { WeeklyActivityChartProps };
