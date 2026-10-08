/**
 * Standard walking speed in kilometers per hour (km/h) for a family with primary-school-aged children.
 *
 * A moderate 4 km/h pace (~15 minutes per kilometre) is used as a realistic baseline for children
 * walking to local parks and open spaces without rushing.
 */
export const WALKING_SPEED_KMH = 4;

/**
 * Pedestrian detour correction multiplier applied to straight-line (Euclidean/Haversine) distances.
 *
 * Adds 30% (+0.3) buffer to account for urban road grids, winding park pathways, cul-de-sacs,
 * and street crossings that make actual walking routes longer than direct line-of-sight distance.
 */
export const WALKING_DETOUR_FACTOR = 1.3;
