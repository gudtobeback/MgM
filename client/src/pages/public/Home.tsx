import React from "react";

import HeroSection from "../../components/home/sections/HeroSection";
import PricingSection from "../../components/home/sections/PricingSection";
import GetStartedSection from "../../components/home/sections/GetStartedSection";
import BriefSection from "../../components/home/sections/BriefSection";
import StatsSection from "../../components/home/sections/StatsSection";
import QuestionsSection from "../../components/home/sections/QuestionsSection";

export default function Home() {
  return (
    <div className="flex flex-col gap-20">
      <HeroSection />

      <GetStartedSection />

      <BriefSection />

      <PricingSection />

      <StatsSection />

      <QuestionsSection />
    </div>
  );
}
