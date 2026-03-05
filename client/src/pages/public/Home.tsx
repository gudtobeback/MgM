import React from "react";

import HeroSection from "../../components/home/sections/HeroSection";
import ChallengesSection from "../../components/home/sections/ChallengesSection";
import SolutionSection from "../../components/home/sections/SolutionSection";
import HowItWorksSection from "../../components/home/sections/HowItWorksSection";
import PricingSection from "../../components/home/sections/PricingSection";
import GetStartedSection from "../../components/home/sections/GetStartedSection";

export default function Home() {
  return (
    <>
      <HeroSection />

      <ChallengesSection />

      <SolutionSection />

      <HowItWorksSection />

      <PricingSection />

      <GetStartedSection />
    </>
  );
}
