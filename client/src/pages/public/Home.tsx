import React, { useEffect } from "react";

import { useLocation } from "react-router-dom";

import HeroSection from "../../components/home/sections/HeroSection";
import PricingSection from "../../components/home/sections/PricingSection";
import GetStartedSection from "../../components/home/sections/GetStartedSection";
import BriefSection from "../../components/home/sections/BriefSection";
import StatsSection from "../../components/home/sections/StatsSection";
import QuestionsSection from "../../components/home/sections/QuestionsSection";

export default function Home() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.replace("#", ""));
      setTimeout(() => {
        el?.scrollIntoView({ behavior: "smooth" });
      }, 100); // slight delay ensures DOM is ready
    }
  }, [hash]);

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
