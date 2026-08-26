"use client";

import { useState } from "react";
import { Preloader } from "@/components/Preloader";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Mission } from "@/components/Mission";
import { Cases } from "@/components/Cases";
import { FeatureTabs } from "@/components/FeatureTabs";
import { Areas } from "@/components/Areas";
import { Services } from "@/components/Services";
import { Mandates } from "@/components/Mandates";
import { CareersCallout } from "@/components/CareersCallout";
import { CTABlocks } from "@/components/CTABlocks";
import { Footer } from "@/components/Footer";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function HomeView({
  home,
  settings,
  areas,
  cases,
}: {
  home: any;
  settings: any;
  areas: any[];
  cases: any[];
}) {
  const [ready, setReady] = useState(false);

  return (
    <>
      <Preloader onComplete={() => setReady(true)} />
      <div className="min-h-screen bg-white text-brand-black selection:bg-black selection:text-white">
        <Navbar settings={settings} />
        <main>
          <Hero ready={ready} data={home?.hero} />
          <Cases data={home?.casesSection} cases={cases} />
          <Mission data={home?.mission} />
          <FeatureTabs data={home?.symptoms} />
          <Areas data={home?.areasSection} areas={areas} />
          <Services data={home?.methodology} />
          <Mandates data={home?.mandates} />
          <CareersCallout data={home?.admission} />
          <CTABlocks data={home?.contact} />
        </main>
        <Footer settings={settings} />
      </div>
    </>
  );
}
