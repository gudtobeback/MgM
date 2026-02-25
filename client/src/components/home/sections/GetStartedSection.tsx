import React from "react";

import { ArrowRight, Play } from "lucide-react";

import CustomButton from "../../ui/CustomButton";

import SectionHeading from "../SectionHeading";
import SectionDescription from "../SectionDescription";

export default function GetStartedSection() {
  return (
    <div className="home-section border-b border-gray-200">
      <div className="flex flex-col items-center gap-8">
        {/* Section Heading */}
        <SectionHeading text="Get Started" variant="blue" />

        <SectionDescription
          des1="Ready to migrate?"
          des2="The entire wizard takes under 5 minutes to set up. Your devices, configurations, and network assignments are handled automatically — no CLI, no manual re-entry. A full backup of your source organization is taken before any change is made. If anything goes wrong, rollback is one click."
        />

        <div className="flex items-center gap-4 mt-2">
          <CustomButton>
            Start migration <ArrowRight size={18} />
          </CustomButton>

          <CustomButton
            text_prop="text-black"
            bg_prop="bg-white"
            className="border border-gray-300 shadow-[0_0px_2px_rgba(0,0,0,0.25)] hover:shadow-[0_0px_2px_rgba(0,0,0,0.50)]"
          >
            <Play
              size={20}
              className="p-1 text-white fill-white bg-gray-500 rounded-full"
            />
            Request Demo
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
