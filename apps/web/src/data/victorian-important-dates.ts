import type { ImportantDate } from "@/types/planner";
import { shiftLocalDateKey } from "@/lib/planner-dates";

const PUBLIC_HOLIDAY_SOURCE_2026 =
  "https://business.vic.gov.au/business-information/public-holidays/victorian-public-holidays-2026";
const PUBLIC_HOLIDAY_SOURCE_2027 =
  "https://business.vic.gov.au/business-information/public-holidays/victorian-public-holidays-2027";
const SCHOOL_HOLIDAY_SOURCE =
  "https://www.vic.gov.au/school-term-dates-and-holidays-victoria";

export const IMPORTANT_DATE_SOURCES = [
  {
    name: "Victorian public holidays",
    licence: "Victorian Government website content",
    url: PUBLIC_HOLIDAY_SOURCE_2026,
  },
  {
    name: "Victorian school term dates and holidays",
    licence: "Victorian Government website content",
    url: SCHOOL_HOLIDAY_SOURCE,
  },
] as const;

type PublicHolidaySeed = readonly [dateKey: string, name: string, source: string];

const PUBLIC_HOLIDAYS: readonly PublicHolidaySeed[] = [
  ["2026-01-01", "New Year's Day", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-01-26", "Australia Day", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-03-09", "Labour Day", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-04-03", "Good Friday", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-04-04", "Saturday before Easter Sunday", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-04-05", "Easter Sunday", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-04-06", "Easter Monday", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-04-25", "ANZAC Day", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-06-08", "King's Birthday", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-09-25", "Friday before the AFL Grand Final", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-11-03", "Melbourne Cup Day", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-12-25", "Christmas Day", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-12-26", "Boxing Day", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2026-12-28", "Additional public holiday for Boxing Day", PUBLIC_HOLIDAY_SOURCE_2026],
  ["2027-01-01", "New Year's Day", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-01-26", "Australia Day", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-03-08", "Labour Day", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-03-26", "Good Friday", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-03-27", "Saturday before Easter Sunday", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-03-28", "Easter Sunday", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-03-29", "Easter Monday", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-04-25", "ANZAC Day", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-06-14", "King's Birthday", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-11-02", "Melbourne Cup Day", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-12-25", "Christmas Day", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-12-26", "Boxing Day", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-12-27", "Additional public holiday for Christmas Day", PUBLIC_HOLIDAY_SOURCE_2027],
  ["2027-12-28", "Additional public holiday for Boxing Day", PUBLIC_HOLIDAY_SOURCE_2027],
];

const SCHOOL_HOLIDAY_RANGES = [
  ["2026-04-03", "2026-04-19"],
  ["2026-06-27", "2026-07-12"],
  ["2026-09-19", "2026-10-04"],
  ["2026-12-19", "2027-01-27"],
  ["2027-03-26", "2027-04-11"],
  ["2027-06-26", "2027-07-11"],
  ["2027-09-18", "2027-10-03"],
  ["2027-12-18", "2028-01-27"],
] as const;

function publicHoliday(seed: PublicHolidaySeed): ImportantDate {
  const [dateKey, name, sourceUrl] = seed;
  return {
    id: `vic-public-${dateKey}-${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`,
    dateKey,
    name,
    kind: "public-holiday",
    sourceUrl,
  };
}

export function getImportantDatesForDate(dateKey: string): ImportantDate[] {
  const dates = PUBLIC_HOLIDAYS.filter(([date]) => date === dateKey).map(
    publicHoliday,
  );

  for (const [startDateKey, endDateKey] of SCHOOL_HOLIDAY_RANGES) {
    if (dateKey >= startDateKey && dateKey <= endDateKey) {
      dates.push({
        id: `vic-school-${startDateKey}-${endDateKey}-${dateKey}`,
        dateKey,
        name: "Victorian school holidays",
        kind: "school-holiday",
        sourceUrl: SCHOOL_HOLIDAY_SOURCE,
      });
    }
  }

  return dates;
}

export function getImportantDatesInRange(
  startDateKey: string,
  endDateKey: string,
): ImportantDate[] {
  const dates: ImportantDate[] = [];
  let current = startDateKey;
  while (current <= endDateKey) {
    dates.push(...getImportantDatesForDate(current));
    current = shiftLocalDateKey(current, 1);
  }
  return dates;
}
