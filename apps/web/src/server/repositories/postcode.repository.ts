import pool from "@/lib/db";

export type PostcodeLocation = {
  postcode: string;
  latitude: number;
  longitude: number;
  suburbs: string;
};

function mapPostcodeLocation(row: Record<string, unknown>): PostcodeLocation {
  return {
    postcode: String(row.postcode),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    suburbs: String(row.suburbs),
  };
}

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

export async function findPostcodeLocation(
  postcode: string,
): Promise<PostcodeLocation | null> {
  const row = await findPostcode(postcode);

  return row ? mapPostcodeLocation(row) : null;
}

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
