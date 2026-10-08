import { ScreenHeader } from "@/components/layout/screen-header";
import {
  AlertCircle,
  BookOpen,
  Database,
  ExternalLink,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ACTIVITY_LIBRARY_INFO,
  CC_BY_4_LICENCE_URL,
  DATA_DISCLAIMER,
  DATA_GOVERNANCE_ABOUT,
  DATA_SOURCES,
  PRIVACY_INTRO,
  PRIVACY_POINTS,
} from "@/lib/data-governance";

/**
 * Comprehensive transparency and data governance section.
 *
 * Organized into four accessible educational cards:
 * 1. **About Our Data:** Details how activities were curated to promote unstructured, screen-free outdoor play.
 * 2. **Where Our Data Comes From:** Open dataset citations (Victorian Government open space records,
 *    BOM/Open-Meteo weather APIs, ABS physical activity surveys) with CC BY 4.0 licenses.
 * 3. **Our Activity Library:** Explains activity taxonomy, age ranges, and safety checks.
 * 4. **Your Privacy:** Unambiguous disclosure that PlayGo does not track users, operate accounts, or send personal logs to any external server.
 *
 * @returns The rendered data governance information cards.
 */
export function DataGovernanceSection() {

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <ScreenHeader
        title="Data Governance"
        description="Transparency about where PlayGo & Co gets data, how activities are created, and how your privacy is protected."
      />

      {/* About Our Data */}
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <Database className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-lg font-bold text-zinc-900">
            ABOUT OUR DATA
          </CardTitle>
        </CardHeader>
        <CardContent className="leading-relaxed text-zinc-700">
          <p>{DATA_GOVERNANCE_ABOUT}</p>
        </CardContent>
      </Card>

      {/* Where Our Data Comes From */}
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
            <MapPin className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-lg font-bold text-zinc-900">
            WHERE OUR DATA COMES FROM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-zinc-700">
          <div className="divide-y divide-zinc-200">
            {DATA_SOURCES.map((item) => (
              <div
                key={item.id}
                className="space-y-1.5 py-4 first:pt-0 last:pb-0"
              >
                <h2 className="text-base font-semibold text-zinc-900">
                  {item.name}
                </h2>
                <p className="text-sm text-zinc-600">
                  <span className="font-medium text-zinc-800">Source: </span>
                  {item.source}
                </p>
                {item.licence && (
                  <p className="text-sm text-zinc-600">
                    <span className="font-medium text-zinc-800">Licence: </span>
                    {item.licence}
                  </p>
                )}
                {item.note && (
                  <p className="text-sm text-zinc-600">{item.note}</p>
                )}
                <div className="pt-1">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 break-all hover:text-indigo-800 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63]"
                  >
                    <span>Link: {item.url}</span>
                    <ExternalLink
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 text-sm">
            <p className="text-zinc-700">
              <span className="font-medium text-zinc-800">
                CC BY 4.0 licence:{" "}
              </span>
              <a
                href={CC_BY_4_LICENCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-indigo-600 break-all hover:text-indigo-800 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63]"
              >
                <span>{CC_BY_4_LICENCE_URL}</span>
                <ExternalLink
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
              </a>
            </p>
          </div>

          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
            <AlertCircle
              className="mt-0.5 size-5 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <p className="leading-relaxed">{DATA_DISCLAIMER}</p>
          </div>
        </CardContent>
      </Card>

      {/* Our Activity Library */}
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <BookOpen className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-lg font-bold text-zinc-900">
            OUR ACTIVITY LIBRARY
          </CardTitle>
        </CardHeader>
        <CardContent className="leading-relaxed text-zinc-700">
          <p>{ACTIVITY_LIBRARY_INFO}</p>
        </CardContent>
      </Card>

      {/* Your Privacy */}
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-lg font-bold text-zinc-900">
            YOUR PRIVACY
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3.5 text-zinc-700">
          <p className="font-medium text-zinc-900">{PRIVACY_INTRO}</p>
          <ul className="space-y-2.5 pl-5 text-sm leading-relaxed sm:text-base list-disc">
            {PRIVACY_POINTS.map((point) => (
              <li key={point} className="text-zinc-700">
                {point}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
