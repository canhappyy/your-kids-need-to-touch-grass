import {
  findNearestPostcodeLocation,
  findPostcode,
} from "@/server/repositories/postcode.repository";

const MAX_GPS_POSTCODE_DISTANCE_KM = 50;

export function isValidPostcode(postcode: string) {
  return /^\d{4}$/.test(postcode);
}

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
