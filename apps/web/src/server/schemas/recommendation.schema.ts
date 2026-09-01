import { z } from "zod";

const integerString = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().safe());

const missionId = z.string().trim().min(1).max(50);

export const recommendationQuerySchema = z
  .object({
    locationMode: z.enum(["nearby", "home"]),
    location: z.string().trim().optional(),
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
      ageMin: value.ageMin,
      ageMax: value.ageMax,
      durationMinutes: value.durationMinutes,
      ...(value.excludeMissionIds.length
        ? { excludeMissionIds: [...new Set(value.excludeMissionIds)] }
        : {}),
      ...(value.missionId ? { missionId: value.missionId } : {}),
    };

    return value.locationMode === "home"
      ? { ...common, locationMode: "home" as const }
      : {
          ...common,
          locationMode: "nearby" as const,
          location: value.location!,
        };
  });
