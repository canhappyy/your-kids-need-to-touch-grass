/**
 * Represents the weather forecast information for an outdoor activity outing.
 *
 * This is a discriminated union based on the `status` property:
 * - `"available"`: Forecast data was successfully retrieved and summarized for the outing window.
 * - `"unavailable"`: Weather data could not be determined (e.g. indoor/home mission, network failure, or missing coordinates).
 */
export type MissionWeather =
  | {
      /** Indicates that weather data could not be retrieved or is not applicable. */
      status: "unavailable";
    }
  | {
      /** Indicates that valid weather forecast data is available for the outing. */
      status: "available";
      /** Human-readable forecast description and packing advice (e.g. "Mainly clear. High UV, bring sunscreen."). */
      summary: string;
      /** Severity rating: "severe" triggers warning callouts for storms or high wind gusts, while "regular" indicates standard conditions. */
      severity: "regular" | "severe";
      /** ISO 8601 timestamp representing the start time of the outing (when the user leaves). */
      startsAt: string;
      /** ISO 8601 timestamp representing the end time of the outing (when the user returns, including commute). */
      endsAt: string;
    };

/**
 * Raw hourly forecast measurements retrieved from the Open-Meteo API.
 *
 * All arrays are parallel and aligned by index, where each index represents
 * a single hour in the forecast timeline. This data is used internally for analysis
 * and is not directly exposed in API responses.
 */
export type HourlyWeather = {
  /** Array of Unix epoch timestamps (in seconds) marking the start of each forecast hour. */
  time: number[];
  /** Array of World Meteorological Organization (WMO) weather interpretation codes (0–99). */
  weather_code: number[];
  /** Array of precipitation probabilities as integer percentages (0–100%). */
  precipitation_probability: number[];
  /** Array of maximum UV Index values for each hour (0 and above). */
  uv_index: number[];
  /** Array of peak wind gust speeds at 10 meters height in kilometers per hour (km/h). */
  wind_gusts_10m: number[];
};
