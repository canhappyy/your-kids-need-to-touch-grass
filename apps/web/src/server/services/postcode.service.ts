import {
  findNearestPostcodeLocation,
  findPostcode,
} from "@/server/repositories/postcode.repository";

/** Maximum radius in kilometers for resolving GPS coordinates to nearest postcode. */
const MAX_GPS_POSTCODE_DISTANCE_KM = 50;

/**
 * Validates whether a given string is a valid Australian 4-digit postcode.
 *
 * @param postcode - The postcode string to test.
 * @returns `true` if postcode matches exactly 4 digits, otherwise `false`.
 */
export function isValidPostcode(postcode: string) {
  return /^\d{4}$/.test(postcode);
}

/**
 * Retrieves postcode details including coordinates and suburbs.
 *
 * @param postcode - The 4-digit postcode string.
 * @returns A promise resolving to the postcode details or `null` if not found.
 */
export async function getPostcode(postcode: string) {
  const row = await findPostcode(postcode);

  if (!row) {
    return null;
  }

  return {
    postcode: row.postcode,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    suburbs: row.suburbs,
  };
}

/**
 * Finds the nearest postcode to GPS coordinates within the maximum allowed radius (50km).
 *
 * @param latitude - Latitude coordinate.
 * @param longitude - Longitude coordinate.
 * @returns A promise resolving to `{ postcode, suburbs }` or `null` if none found within radius.
 */
export async function getNearestPostcode(
  latitude: number,
  longitude: number,
) {
  const row = await findNearestPostcodeLocation(
    latitude,
    longitude,
    MAX_GPS_POSTCODE_DISTANCE_KM,
  );

  return row
    ? {
        postcode: row.postcode,
        suburbs: row.suburbs,
      }
    : null;
}
