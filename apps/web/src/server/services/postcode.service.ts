import { findPostcode } from "@/server/repositories/postcode.repository";

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
