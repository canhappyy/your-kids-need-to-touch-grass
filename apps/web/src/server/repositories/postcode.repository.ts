import pool from "@/lib/db";
import type { PostcodeLocation } from "@/types/location";

export type { PostcodeLocation };

/**
 * Maps a raw database row into a structured `PostcodeLocation` object.
 *
 * @param row - The raw query row from the database.
 * @returns A structured `PostcodeLocation` object.
 */
function mapPostcodeLocation(row: Record<string, unknown>): PostcodeLocation {
  return {
    postcode: String(row.postcode),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    suburbs: String(row.suburbs),
  };
}

/**
 * Retrieves the raw database record for a given postcode.
 *
 * @param postcode - The 4-digit postcode string to look up.
 * @returns A promise resolving to the raw database row or `null` if not found.
 */
export async function findPostcode(postcode: string) {
  const result = await pool.query(
    `
    SELECT
      postcode,
      latitude,
      longitude,
      suburbs
    FROM postcode
    WHERE postcode = $1;
    `,
    [postcode],
  );

  return result.rows[0] ?? null;
}

/**
 * Finds and returns a mapped `PostcodeLocation` for a specific postcode.
 *
 * @param postcode - The 4-digit postcode string to look up.
 * @returns A promise resolving to the `PostcodeLocation` or `null` if not found.
 */
export async function findPostcodeLocation(
  postcode: string,
): Promise<PostcodeLocation | null> {
  const row = await findPostcode(postcode);

  return row ? mapPostcodeLocation(row) : null;
}

/**
 * Searches for postcodes matching a given suburb name (case-insensitive).
 *
 * @param suburb - The suburb name to search for.
 * @returns A promise resolving to an array of up to 2 matching `PostcodeLocation` records.
 */
export async function findPostcodeLocationsBySuburb(
  suburb: string,
): Promise<PostcodeLocation[]> {
  const result = await pool.query(
    `
    SELECT
      postcode,
      latitude,
      longitude,
      suburbs
    FROM postcode AS p
    WHERE EXISTS (
      SELECT 1
      FROM unnest(string_to_array(p.suburbs, ',')) AS listed_suburb
      WHERE lower(btrim(listed_suburb)) = lower($1)
    )
    ORDER BY postcode
    LIMIT 2;
    `,
    [suburb],
  );

  return result.rows.map(mapPostcodeLocation);
}

/**
 * Finds the nearest postcode location to a pair of GPS coordinates within a maximum radius.
 *
 * @param latitude - Latitude coordinate.
 * @param longitude - Longitude coordinate.
 * @param maxDistanceKm - Maximum search radius in kilometers.
 * @returns A promise resolving to the closest `PostcodeLocation` or `null` if none found within radius.
 */
export async function findNearestPostcodeLocation(
  latitude: number,
  longitude: number,
  maxDistanceKm: number,
): Promise<PostcodeLocation | null> {
  const result = await pool.query(
    `
    WITH postcode_distances AS (
      SELECT
        postcode,
        latitude,
        longitude,
        suburbs,
        earth_distance(
          ll_to_earth($1, $2),
          ll_to_earth(latitude, longitude)
        ) AS distance_metres
      FROM postcode
    )
    SELECT
      postcode,
      latitude,
      longitude,
      suburbs
    FROM postcode_distances
    WHERE distance_metres <= $3 * 1000
    ORDER BY distance_metres, postcode
    LIMIT 1;
    `,
    [latitude, longitude, maxDistanceKm],
  );

  return result.rows[0] ? mapPostcodeLocation(result.rows[0]) : null;
}
