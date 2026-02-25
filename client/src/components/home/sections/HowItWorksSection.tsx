import React from "react";

import SectionHeading from "../SectionHeading";
import SectionDescription from "../SectionDescription";
import StepFlow from "../StepFlow";

export default function HowItWorksSection() {
  return (
    <div id="how" className="home-section border-b border-gray-200">
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
