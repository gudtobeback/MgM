import React from "react";

import HeroSection from "@/src/components/public_pages/HeroSection";
import { Locate, MapPin } from "lucide-react";
import OvalButton from "@/src/components/home/OvalButton";

const Heading = ({ children }: { children: any }) => {
  return (
    <div className="relative w-fit text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14">
      {children}

      <div className="absolute right-0 w-25 border-2 border-[#D7FB71] rounded-full"></div>
    </div>
  );
};

export default function AboutUs() {
  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <HeroSection
        title="About Us"
        desc="AurionOne is a next-generation network automation platform designed to replace manual complexity with intelligent, high-speed architectural stability."
      />

      <div className="flex flex-col gap-16 mx-5 lg:mx-20">
        <div className="space-y-5">
          <Heading>
            Who <span className="font-semibold text-[#015C95]">We Are</span>
          </Heading>

          <p className="text-sm text-[#000000CC] leading-relaxed">
            AurionOne is a next-generation network automation platform dedicated
            to transforming how modern enterprises manage their digital
            foundations. We bridge the gap between complex hardware ecosystems
            and the need for agile, error-free operations.
          </p>

          <div className="flex items-stretch rounded-2xl overflow-hidden">
            <div className="w-1 bg-[#D0F059]"></div>
            <div className="p-6 flex flex-col gap-5 bg-[#F3F4F5]">
              <div className="flex items-center gap-1 font-semibold text-sm text-[#015C95]">
                <MapPin size={18} />
                <span>Our Legacy</span>
              </div>

              <div className="text-sm text-[#000000CC] leading-relaxed">
                Headquartered in Mumbai, Dealmytime Services Pvt Ltd has been a
                prominent partner of Cisco for over 14 years, delivering
                cutting-edge networking solutions to enterprises across
                industries.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <Heading>
            Innovations &{" "}
            <span className="font-semibold text-[#015C95]">Recognition</span>
          </Heading>

          <div className="flex items-end justify-between">
            <p className="w-[400px] text-sm text-[#000000CC] leading-relaxed">
              Our commitment to innovation has been globally recognized. This
              recognition reflects our ability to build real-world solutions
              that solve complex enterprise challenges at scale.
            </p>

            <span className="px-3 py-1.5 text-[11px] text-white bg-[#003E68] rounded-full">
              Award Year 2025
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            {[
              {
                title: "Global Winner",
                desc: "Cisco Innovation Partner of the Year",
                bg_color: "bg-[#003E68]",
              },
              {
                title: "APJC Winner",
                desc: "Cisco Innovation Partner of the Year",
                bg_color: "bg-[#253C5F]",
              },
              {
                title: "India Winner",
                desc: "Cisco Innovation Partner of the Year",
                bg_color: "bg-[#003E68]",
              },
            ].map((data) => (
              <div className="w-full p-8 flex flex-col gap-3 bg-[#003E68] rounded-2xl">
                <p className="font-medium text-sm text-[#D0F059]">
                  {data?.title}
                </p>
                <p className="text-md text-white">{data?.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
