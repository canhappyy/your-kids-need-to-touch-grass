"use client";

import { TopNav } from "@/components/layout/top-nav";
import { LandingHero } from "./landing-hero";
import { HowItWorks } from "./how-it-works";
import { FeaturesSection } from "./features-section";
import { BadgeShowcase } from "./badge-showcase";
import { GuidelineBanner } from "./guideline-banner";
import { LandingCta } from "./landing-cta";
import { LandingFooter } from "./landing-footer";

/**
 * Top-level container component for the dedicated PlayGo & Co landing page.
 *
 * Welcomes first-time and returning visitors with an immediate understanding
 * of the app's purpose, value propositions, and core features.
 */
export function LandingSection() {
  return (
    <>
      <TopNav showHistory />

      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <LandingHero />
        <HowItWorks />
        <FeaturesSection />
        <BadgeShowcase />
        <GuidelineBanner />
        <LandingCta />
        <LandingFooter />
      </div>
    </>
  );
}
