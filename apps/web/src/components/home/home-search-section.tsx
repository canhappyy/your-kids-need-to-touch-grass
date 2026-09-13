"use client";

import {
  readPlayPreferences,
  playPreferenceParams,
} from "@/lib/play-preferences";
import { TopNav } from "@/components/layout/top-nav";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  calculateRangeFromBuckets,
  getInitialBuckets,
} from "@/lib/home-search";
import type { AgeBucketId } from "@/types/home-search";
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

  const hasAgeParams = searchParams.has("ageMin") || searchParams.has("ageMax");
  const ageBucketsParam = searchParams.get("ageBuckets");

  let initialSelectedBuckets: AgeBucketId[] = [];

  if (ageBucketsParam !== null) {
    initialSelectedBuckets = ageBucketsParam
      ? (ageBucketsParam.split(",") as AgeBucketId[])
      : [];
  } else if (hasAgeParams) {
    const min = getNumberParam("ageMin", 5);
    const max = getNumberParam("ageMax", 12);
    if (min === 5 && max === 12) {
      initialSelectedBuckets = [];
    } else {
      initialSelectedBuckets = getInitialBuckets([min, max]);
    }
  } else {
    initialSelectedBuckets = [];
  }

  const queryLat = searchParams.get("lat");
  const queryLng = searchParams.get("lng");
  const parsedLat = queryLat ? parseFloat(queryLat) : undefined;
  const parsedLng = queryLng ? parseFloat(queryLng) : undefined;
  const initialLat = Number.isFinite(parsedLat) ? parsedLat : undefined;
  const initialLng = Number.isFinite(parsedLng) ? parsedLng : undefined;

  const initialValues: HomeSearchValues = {
    ...readPlayPreferences(searchParams),
    locationMode:
      searchParams.get("locationMode") === "home"
        ? "home"
        : ("nearby" as LocationMode),
    location: searchParams.get("location") || "",
    latitude: initialLat,
    longitude: initialLng,
    selectedBuckets: initialSelectedBuckets,
    hours: 0,
    minutes: initialMinutes,
  };

  const locationErrorMessages: Record<string, string> = {
    "not-found":
      "We couldn't find that postcode or suburb. Check it and try again.",
    ambiguous: "Enter a postcode to choose the correct suburb.",
    invalid: "Enter a valid four-digit postcode or suburb.",
  };
  const locationErrorCode = searchParams.get("locationError") || "";

  const handleSubmit = (values: HomeSearchValues) => {
    const params = new URLSearchParams(playPreferenceParams(values));
    params.set("locationMode", values.locationMode);
    if (values.locationMode === "nearby") {
      params.set("location", values.location);
      if (values.latitude !== undefined && values.longitude !== undefined) {
        params.set("lat", values.latitude.toString());
        params.set("lng", values.longitude.toString());
      }
    }
    const [ageMin, ageMax] = calculateRangeFromBuckets(values.selectedBuckets);
    params.set("ageMin", ageMin.toString());
    params.set("ageMax", ageMax.toString());
    if (values.selectedBuckets.length > 0) {
      params.set("ageBuckets", values.selectedBuckets.join(","));
    }
    params.set("hours", (values.hours ?? 0).toString());
    params.set("minutes", values.minutes.toString());
    router.push(`/result?${params.toString()}`);
  };

  return (
    <>
      <TopNav showHistory />

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
