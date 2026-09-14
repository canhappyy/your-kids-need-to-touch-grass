import { z } from "zod";

const integerString = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().safe());

const coordinate = z.string().trim().transform(Number).pipe(z.number().finite());
const missionId = z.string().trim().min(1).max(50);

/** Query validation for GET /api/recommendations/chain. */
export const chainedRecommendationQuerySchema = z
  .object({
    playStyle: z.enum(["solo", "group"]).default("solo"),
    canSupervise: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    location: z.string().trim().min(1).max(100),
    lat: coordinate.optional(),
    lng: coordinate.optional(),
    ageMin: integerString.pipe(z.number().min(5).max(12)),
    ageMax: integerString.pipe(z.number().min(5).max(12)),
    primaryMissionId: missionId,
    openSpaceId: integerString.pipe(z.number().positive()),
    secondaryMissionId: missionId.optional(),
  })
  .superRefine((value, context) => {
    if (value.ageMin > value.ageMax) {
      context.addIssue({
        code: "custom",
        message: "Minimum age cannot exceed maximum age.",
        path: ["ageMin"],
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
  })
  .transform((value) => ({
    playStyle: value.playStyle,
    canSupervise: value.canSupervise,
    location: value.location,
    ageMin: value.ageMin,
    ageMax: value.ageMax,
    primaryMissionId: value.primaryMissionId,
    openSpaceId: value.openSpaceId,
    ...(value.lat !== undefined && value.lng !== undefined
      ? { latitude: value.lat, longitude: value.lng }
      : {}),
    ...(value.secondaryMissionId
      ? { missionId: value.secondaryMissionId }
      : {}),
  }));
