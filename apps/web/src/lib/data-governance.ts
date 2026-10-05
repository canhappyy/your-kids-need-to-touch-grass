/**
 * Data governance and open data configuration for PlayGo.
 */

import {
  ABS_ACTIVITY_SOURCE,
  AUSTRALIAN_GUIDELINE_SOURCE,
} from "@/data/australian-activity-reference";

export type DataSource = {
  id: string;
  name: string;
  source: string;
  licence?: string;
  note?: string;
  url: string;
};

export const DATA_GOVERNANCE_ABOUT =
  "playgo & co recommends activities using open data from government and community sources, combined with an activity library written by our own team.";

export const DATA_SOURCES: DataSource[] = [
  {
    id: "open-space",
    name: "Open Space",
    source:
      "Victorian Planning Authority, via DataVic (builds on work by the Victorian Environmental Assessment Council)",
    licence: "Creative Commons Attribution 4.0 International (CC BY 4.0)",
    url: "https://discover.data.vic.gov.au/dataset/open-space",
  },
  {
    id: "australian-postcodes",
    name: "Australian Postcodes",
    source: "Matthew Proctor (community-sourced database)",
    note: "Made freely available by its maintainer for public use.",
    url: "https://www.matthewproctor.com/australian_postcodes",
  },
  {
    id: "weather",
    name: "Weather",
    source: "Weather data by Open-Meteo.com",
    licence: "Creative Commons Attribution 4.0 International (CC BY 4.0)",
    url: "https://open-meteo.com",
  },
  {
    id: "victorian-public-holidays",
    name: "Victorian Public Holidays",
    source: "Business Victoria, Victorian Government",
    note: "Bundled snapshot for 2026 and 2027; dates may be updated by the Victorian Government.",
    url: "https://business.vic.gov.au/business-information/public-holidays/victorian-public-holidays-2026",
  },
  {
    id: "victorian-school-dates",
    name: "Victorian School Term Dates",
    source: "Department of Education, Victorian Government",
    note: "Bundled school holiday ranges derived from published government school term dates.",
    url: "https://www.vic.gov.au/school-term-dates-and-holidays-victoria",
  },
  {
    id: "national-activity-reference",
    name: "National Nutrition and Physical Activity Survey 2023",
    source: "Australian Bureau of Statistics",
    note: "Bundled age-group averages and activity-time distributions used for device-local dashboard comparisons.",
    url: ABS_ACTIVITY_SOURCE.url,
  },
  {
    id: "national-activity-guideline",
    name: "Australian 24-Hour Movement Guidelines",
    source: "Australian Government Department of Health, Disability and Ageing",
    note: "Children and young people aged 5–17 should accumulate at least 60 minutes of moderate to vigorous physical activity each day.",
    url: AUSTRALIAN_GUIDELINE_SOURCE.url,
  },
];

export const CC_BY_4_LICENCE_URL =
  "https://creativecommons.org/licenses/by/4.0/";

export const DATA_DISCLAIMER =
  "Open data is provided as-is. Park and Playground details can change, so please check local signage and conditions before you play.";

export const ACTIVITY_LIBRARY_INFO =
  "Every activity and mission in playgo is written and curated by the playgo team, and checked for age suitability, time needed and supervision needs.";

export const PRIVACY_INTRO =
  "playgo doesn't use accounts and never asks for your name or your children's details.";

export const PRIVACY_POINTS = [
  "Your preferences and progress are saved only on this device. playgo never stores them on a server or shares them with anyone.",
  "Your location or postcode is used only to find nearby activities and is not saved.",
  "To check the weather, an approximate location is sent to Open-Meteo. No other information is sent.",
  "Directions open in Google Maps, which has its own privacy policy.",
];
