"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  HomeSearchForm,
  type HomeSearchValues,
  type LocationMode,
} from "./home-search-form";

export function HomeSearchSection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getNumberParam = (key: string, fallback: number): number => {
    const val = searchParams.get(key);
    if (!val) return fallback;
    const parsed = parseInt(val, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  const queryHours = getNumberParam("hours", 0);
  const queryMinutes = getNumberParam("minutes", 0);
  const totalMinutesFromQuery =
    queryHours > 0 && queryMinutes === 0 ? queryHours * 60 : queryMinutes || 45;
  const initialMinutes = [15, 30, 45, 60, 75, 90].includes(
    totalMinutesFromQuery,
  )
    ? totalMinutesFromQuery
    : 45;

  const initialValues: HomeSearchValues = {
    locationMode:
      searchParams.get("locationMode") === "home"
        ? "home"
        : ("nearby" as LocationMode),
    location: searchParams.get("location") || "",
    ageRange: [getNumberParam("ageMin", 7), getNumberParam("ageMax", 9)],
    hours: 0,
    minutes: initialMinutes,
  };

  const locationErrorMessages: Record<string, string> = {
    "not-found": "We couldn't find that postcode. Check it and try again.",
    ambiguous: "Enter a postcode to choose the correct suburb.",
    invalid: "Enter a valid four-digit postcode.",
  };
  const locationErrorCode = searchParams.get("locationError") || "";

  const handleSubmit = (values: HomeSearchValues) => {
    const params = new URLSearchParams();
    params.set("locationMode", values.locationMode);
    if (values.locationMode === "nearby") {
      params.set("location", values.location);
    }
    params.set("ageMin", values.ageRange[0].toString());
    params.set("ageMax", values.ageRange[1].toString());
    params.set("hours", (values.hours ?? 0).toString());
    params.set("minutes", values.minutes.toString());
    router.push(`/result?${params.toString()}`);
  };

  return (
    <>
      <header className="flex justify-center">
        <h1>
          <Image
            src="/playgo.svg"
            alt="PlayGo"
            width={142}
            height={47}
            priority
          />
        </h1>
      </header>

      <HomeSearchForm
        initialLocationError={locationErrorMessages[locationErrorCode]}
        initialValues={initialValues}
        onValidSubmit={handleSubmit}
      />
    </>
  );
}
