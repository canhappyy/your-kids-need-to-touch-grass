import { findPostcode } from "@/server/repositories/postcode.repository";
import { findAllActivities } from "@/server/repositories/activity.repository";

type RecommendationInput = {
  postcode: string;
  age: number;
  duration: number;
};

export async function getRecommendations(input: RecommendationInput) {
  const postcode = await findPostcode(input.postcode);

  if (!postcode) {
    return [];
  }

  const activities = await findAllActivities();

  const suitableActivities = activities.filter((activity) => {
    const ageSuitable =
      (input.age >= 5 && input.age <= 7 && activity.age_5_7 === "Y") ||
      (input.age >= 8 && input.age <= 9 && activity.age_8_9 === "Y") ||
      (input.age >= 10 && input.age <= 12 && activity.age_10_12 === "Y");

    const durationSuitable = activity.duration_minutes <= input.duration;

    return ageSuitable && durationSuitable;
  });

  return suitableActivities.slice(0, 5);
}
