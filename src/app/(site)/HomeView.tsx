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
  cases,
}: {
  home: any;
  settings: any;
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
          {/* Las ocho funciones: <Areas/> con tarjetas sin slug. */}
          <Areas data={home?.functions} />
          <Mission data={home?.mission} />
          <FeatureTabs data={home?.symptoms} />
          <Cases data={home?.casesSection} cases={cases} />
          <Services data={home?.methodology} />
          {/* Comparativa montarlo-tú / con-nosotros. */}
          <CareersCallout data={home?.admission} />
          <Mandates data={home?.mandates} />
          <CTABlocks data={home?.contact} />
        </main>
        <Footer settings={settings} />
      </div>
    </>
  );
}
