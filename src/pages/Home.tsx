import { useState } from "react";
import { Preloader } from "../components/Preloader";
import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { Mission } from "../components/Mission";
import { FeatureTabs } from "../components/FeatureTabs";
import { Areas } from "../components/Areas";
import { Services } from "../components/Services";
import { Mandates } from "../components/Mandates";
import { CareersCallout } from "../components/CareersCallout";
import { Firm } from "../components/Firm";
import { CTABlocks } from "../components/CTABlocks";
import { Footer } from "../components/Footer";

export function Home() {
  const [ready, setReady] = useState(false);

  return (
    <>
      <Preloader onComplete={() => setReady(true)} />
      <div className="min-h-screen bg-white text-brand-black selection:bg-black selection:text-white">
        <Navbar />
        <main>
          <Hero ready={ready} />
          <Mission />
          <FeatureTabs />
          <Areas />
          <Services />
          <Mandates />
          <CareersCallout />
          <Firm />
          <CTABlocks />
        </main>
        <Footer />
      </div>
    </>
  );
}
