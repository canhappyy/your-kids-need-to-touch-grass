export type NationalActivityReferenceBand = {
  minAge: number;
  maxAge: number;
  averageMinutes: number;
  distribution: readonly number[];
};

export const ABS_ACTIVITY_SOURCE = {
  name: "ABS National Nutrition and Physical Activity Survey 2023",
  url: "https://www.abs.gov.au/statistics/health/food-and-nutrition/national-nutrition-and-physical-activity-survey/2023",
} as const;

export const AUSTRALIAN_GUIDELINE_SOURCE = {
  name: "Australian 24-Hour Movement Guidelines",
  url: "https://www.health.gov.au/topics/physical-activity-and-exercise/physical-activity-and-exercise-guidelines-for-all-australians/for-children-and-young-people-5-to-17-years",
} as const;

/** ABS 2023 average daily activity and reported-time distribution bins. */
export const NATIONAL_ACTIVITY_BANDS: readonly NationalActivityReferenceBand[] = [
  {
    minAge: 5,
    maxAge: 8,
    averageMinutes: 105,
    distribution: [1.1, 6.1, 17.6, 22.3, 14.1, 10.1, 7.3, 11.1],
  },
  {
    minAge: 9,
    maxAge: 11,
    averageMinutes: 94,
    distribution: [0.6, 10.3, 17.4, 21.7, 17.5, 10.4, 5.8, 7.3],
  },
  {
    minAge: 12,
    maxAge: 14,
    averageMinutes: 72,
    distribution: [1.5, 13.8, 28.2, 22, 13.5, 6.5, 2.8, 3.2],
  },
] as const;

export const OVERALL_NATIONAL_ACTIVITY_REFERENCE = {
  averageMinutes: 85,
  distribution: [2.2, 12.9, 21.6, 20.1, 13.4, 8.8, 5.1, 6.9],
} as const;
