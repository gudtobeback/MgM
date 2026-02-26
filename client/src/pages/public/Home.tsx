import React from "react";

import Header from "../../components/home/Header";
import HeroSection from "../../components/home/sections/HeroSection";
import ChallengesSection from "../../components/home/sections/ChallengesSection";
import SolutionSection from "../../components/home/sections/SolutionSection";
import HowItWorksSection from "../../components/home/sections/HowItWorksSection";
import PricingSection from "../../components/home/sections/PricingSection";
import GetStartedSection from "../../components/home/sections/GetStartedSection";
import Footer from "../../components/home/Footer";

export default function Home() {
  return (
    <div className="text-black/80">
      <Header />

      {/* Body */}
      <div className="flex flex-col bg-[#fafafa]">
        {/* Hero body */}
        <HeroSection />

        <ChallengesSection />

        <SolutionSection />

        <HowItWorksSection />

        <PricingSection />

        <GetStartedSection />
      </div>

      <Footer />
    </div>
  );
}
