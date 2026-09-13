export type MissionWeather =
  | { status: "unavailable" }
  | {
      status: "available";
      summary: string;
      severity: "regular" | "severe";
      startsAt: string;
      endsAt: string;
    };

/** Internal forecast measurements; never included in recommendation responses. */
export type HourlyWeather = {
  time: number[];
  weather_code: number[];
  precipitation_probability: number[];
  uv_index: number[];
  wind_gusts_10m: number[];
};
