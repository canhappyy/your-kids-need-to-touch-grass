/**
 * Data governance and open data configuration for PlayGo.
 */

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
