import React from "react";

import StepFlow from "../StepFlow";
import SectionHeading from "../SectionHeading";
import SectionDescription from "../SectionDescription";

import { useFadeInOnScroll } from "@/src/hooks/useFadeInOnScroll";

export default function HowItWorksSection() {
  const fadeRef = useFadeInOnScroll();

  return (
    <div
      id="how"
      ref={fadeRef}
      className="home-section fade-in-scroll bg-[#fafafa] border-b border-gray-200"
    >
      <div className="flex flex-col items-center gap-8">
        {/* Section Heading */}
        <SectionHeading text="How It Works" variant="blue" />

        <SectionDescription
          des1="A six-step automated workflow."
          des2="Every migration follows the same structured sequence. No steps skipped, no config missed."
        />

        <StepFlow />
      </div>
    </div>
  );
}
