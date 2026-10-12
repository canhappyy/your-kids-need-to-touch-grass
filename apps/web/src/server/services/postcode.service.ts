import {
  findNearestPostcodeLocation,
  findPostcode,
} from "@/server/repositories/postcode.repository";

/**
* Maximum search radius in kilometers when resolving user device GPS coordinates
* to the nearest known Victorian postcode. If the user is further than 50km from any
* Victorian postcode in our database (e.g. interstate or offshore), coordinate resolution returns null.
*/
const MAX_GPS_POSTCODE_DISTANCE_KM = 50;

/**
* Rounds GPS coordinates to 2 decimal places (suburb-level precision).
* This obfuscates street-level location data while maintaining postcode accuracy.
* 
* @param coordinate - The latitude or longitude to round.
* @returns The coordinate rounded to 2 decimal places.
*/
function roundCoordinate(coordinate: number): number {
  return Math.round(coordinate * 100) / 100;
}

/**
* Retrieves postcode details including centroid coordinates and associated suburb names.
*
* This function queries the postcode database for a specific 4-digit Australian postcode.
* It casts the database string/numeric coordinates into standard JavaScript numbers and
* returns an array of suburb names that fall within that postcode area.
*
* @param postcode - The 4-digit Australian postcode string (e.g., "3000", "3168").
* @returns A promise resolving to the postcode object with numeric coordinates and suburbs,
* or `null` if the postcode is not found in the Victorian database.
*
* @example
* ```ts
* const details = await getPostcode("3168");
* if (details) {
*   console.log(`Clayton is in ${details.suburbs.join(", ")}`);
* }
* ```
*/
export async function getPostcode(postcode: string) {
  // Query the database for the given postcode
  const row = await findPostcode(postcode);

  // Return null if no matching postcode was found
  if (!row) {
    return null;
  }

  // Ensure latitude and longitude are formatted as standard floating-point numbers
  return {
    postcode: row.postcode,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    suburbs: row.suburbs,
  };
}

/**
* Finds the nearest Victorian postcode to GPS coordinates within the maximum allowed radius (50km).
*
* Used primarily for geolocation lookup when a parent allows browser location access.
* Uses the Haversine formula inside PostgreSQL to find the closest postcode centroid.
* Coordinates are rounded to 2 decimal places (suburb-level precision) to protect user privacy
* and comply with COPPA regulations for children's applications.
*
* @param latitude - User's current latitude coordinate in decimal degrees.
* @param longitude - User's current longitude coordinate in decimal degrees.
* @returns A promise resolving to `{ postcode, suburbs, latitude, longitude }` with rounded coordinates,
* or `null` if no postcode is within 50km.
*
* @example
* ```ts
* const nearest = await getNearestPostcode(-37.8136, 144.9631);
* if (nearest) {
*   console.log(`Nearest postcode is ${nearest.postcode} at (${nearest.latitude}, ${nearest.longitude})`);
* }
* ```
*/
export async function getNearestPostcode(
  latitude: number,
  longitude: number,
) {
  // Search the repository for nearest postcode within 50km
  const row = await findNearestPostcodeLocation(
    latitude,
    longitude,
    MAX_GPS_POSTCODE_DISTANCE_KM,
  );

  // If found, return postcode with rounded coordinates for privacy compliance
  return row
    ? {
        postcode: row.postcode,
        suburbs: row.suburbs,
        latitude: roundCoordinate(row.latitude),
        longitude: roundCoordinate(row.longitude),
      }
    : null;
}
