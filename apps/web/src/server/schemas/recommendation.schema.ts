import { z } from "zod";

/**
 * Parses and validates a numeric query parameter string into a safe integer.
 */
const integerString = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().safe());

/**
 * Parses and validates an optional floating-point coordinate number.
 */
const coordinateNumber = z
  .string()
  .trim()
  .transform(Number)
  .pipe(z.number().finite());

/**
 * Validates a single mission identifier string (1 to 50 characters).
 */
const missionId = z.string().trim().min(1).max(50);

/**
 * Validates and transforms query parameters for the activity recommendation endpoint (`GET /api/recommendations`).
 *
 * Validation rules:
 * 1. Play Preferences (`playStyle` & `canSupervise`):
 *    - `playStyle`: optional enum (`"solo"` | `"group"`), defaults to `"solo"`.
 *    - `canSupervise`: optional string boolean (`"true"` | `"false"`), defaults to `"false"`, transformed into a boolean.
 *
 * 2. Mode and Location (`locationMode`, `location`, `lat`, & `lng`):
 *    - `locationMode`: must be either `"nearby"` (venue/park-based) or `"home"` (indoor/home-based).
 *    - `location`: optional trimmed string; required (1 to 100 characters) when `locationMode` is `"nearby"`.
 *    - `lat` / `lng`: optional finite coordinates; if provided, both must be supplied together.
 *
 * 3. Age Bounds (`ageMin` & `ageMax`):
 *    - Accepts numeric strings between 5 and 12.
 *    - Cross-field validation: `ageMin` cannot be greater than `ageMax`.
 *
 * 4. Duration (`durationMinutes`):
 *    - Accepts numeric strings between 5 and 775 minutes, must be an interval of 5.
 *
 * 5. Mission Exclusions & Replay (`excludeMissionIds` & `missionId`):
 *    - `excludeMissionIds`: array of up to 10 previously seen mission IDs.
 *    - `missionId`: optional target mission ID to replay.
 *    - Cross-field validation: replay of a specific `missionId` cannot be combined with exclusions.
 *
 * Transformations:
 * 1. Deduplication: removes any duplicate IDs from `excludeMissionIds`.
 * 2. Discriminated output: guarantees `location` is present when `locationMode` is `"nearby"`, along with optional `latitude`/`longitude`, and omits them for `"home"`.
 */
export const recommendationQuerySchema = z
  .object({
    playStyle: z.enum(["solo", "group"]).default("solo"),
    canSupervise: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    locationMode: z.enum(["nearby", "home"]),
    location: z.string().trim().optional(),
    lat: coordinateNumber.optional(),
    lng: coordinateNumber.optional(),
    ageMin: integerString.pipe(z.number().min(5).max(12)),
    ageMax: integerString.pipe(z.number().min(5).max(12)),
    durationMinutes: integerString.pipe(
      z.number().min(5).max(775).multipleOf(5),
    ),
    excludeMissionIds: z.array(missionId).max(10),
    missionId: missionId.optional(),
  })
  .superRefine((value, context) => {
    if (
      value.locationMode === "nearby" &&
      (!value.location || value.location.length > 100)
    ) {
      context.addIssue({
        code: "custom",
        message: "Location is required for nearby recommendations.",
        path: ["location"],
      });
    }

    if (
      (value.lat !== undefined && value.lng === undefined) ||
      (value.lat === undefined && value.lng !== undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "Both latitude and longitude must be provided together.",
        path: [value.lat === undefined ? "lat" : "lng"],
      });
    }

    if (value.ageMin > value.ageMax) {
      context.addIssue({
        code: "custom",
        message: "Minimum age cannot exceed maximum age.",
        path: ["ageMin"],
      });
    }

    if (value.missionId && value.excludeMissionIds.length > 0) {
      context.addIssue({
        code: "custom",
        message: "A mission replay cannot include exclusions.",
        path: ["missionId"],
      });
    }
  })
  .transform((value) => {
    const common = {
      playStyle: value.playStyle,
      canSupervise: value.canSupervise,
      ageMin: value.ageMin,
      ageMax: value.ageMax,
      durationMinutes: value.durationMinutes,
      ...(value.excludeMissionIds.length
        ? { excludeMissionIds: [...new Set(value.excludeMissionIds)] }
        : {}),
      ...(value.missionId ? { missionId: value.missionId } : {}),
    };

    const hasCoords =
      value.locationMode === "nearby" &&
      value.lat !== undefined &&
      value.lng !== undefined;

    return value.locationMode === "home"
      ? { ...common, locationMode: "home" as const }
      : {
          ...common,
          locationMode: "nearby" as const,
          location: value.location!,
          ...(hasCoords ? { latitude: value.lat, longitude: value.lng } : {}),
        };
  });
