import React from "react";

import {
  AtSign,
  Award,
  BookMarked,
  BadgeCheck,
  Bug,
  CircleCheck,
  SquareArrowRight,
  Wrench,
  Compass,
} from "lucide-react";

import HeroSection from "@/src/components/public_pages/HeroSection";
import OvalButton from "@/src/components/home/OvalButton";

const Heading = ({
  text,
  underlinetext,
}: {
  text?: any;
  underlinetext?: any;
}) => {
  return (
    <div className="w-fit text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14">
      {text}
      {underlinetext && (
        <>
          {" "}
          <span className="inline flex flex-col relative w-fit font-semibold text-[#015C95]">
            {underlinetext}
            <span className="absolute -bottom-1 right-0 w-25 border-2 border-[#D7FB71] rounded"></span>
          </span>
        </>
      )}
    </div>
  );
};

export default function Support() {
  return (
    <div className="flex flex-col gap-15">
      {/* Hero */}
      <HeroSection
        title="Support"
        desc="Whether you're planning a migration, actively deploying, or need troubleshooting assistance, the AurionOne support team is ready to assist you."
      />

      <div className="flex flex-col gap-16 mx-5 lg:mx-20">
        {/* Contact Support */}
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-3 sm:col-span-2 flex flex-col gap-10">
            <Heading text="Contact" underlinetext="Support" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="col-span-1 p-8 flex flex-col gap-5 border border-[#C1C7D11A] shadow-[0_0_1px_0_rgba(0,0,0,0.25)] rounded-3xl">
                <div className="p-3 w-fit bg-[#F3F4F5] rounded-xl">
                  <AtSign size={24} />
                </div>

                <p className="font-medium text-lg text-[#191C1D]">
                  Email Support
                </p>

                <p className="text-xs text-[#41474F]">
                  Direct line to our general support engineers for standard
                  inquiries and platform questions.
                </p>

                <p className="font-semibold text-[#003E68]">
                  support@aurionone.com
                </p>
              </div>

              <div className="col-span-1 p-8 flex flex-col gap-5 bg-[#003E68] rounded-3xl">
                <div className="p-3 w-fit bg-[#FFFFFF1A] rounded-xl">
                  <Award size={24} className="text-[#D0F059]" />
                </div>

                <p className="font-medium text-lg text-white">
                  Priority Support
                </p>

                <p className="text-xs text-[#D0E4FF]">
                  Dedicated architectural guidance and rapid incident response
                  for our Enterprise partners.
                </p>

                <OvalButton>Access Portal</OvalButton>
              </div>
            </div>
          </div>

          <div className="col-span-3 sm:col-span-1 p-8 flex flex-col justify-between gap-5 bg-[#F3F4F5] rounded-3xl">
            <div className="font-semibold text-lg text-[#003E68]">
              Response Times
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1 text-xs">
                  <p className="uppercase text-[#717781]">standard</p>
                  <p className="text-sm text-[#191C1D]">Business Support</p>
                </div>
                <div className="text-md font-semibold text-[#003E68]">24h</div>
              </div>

              <div className="border-b border-[#C1C7D133]"></div>

              <div className="flex items-center justify-between">
                <div className="space-y-1 text-xs">
                  <p className="uppercase text-[#536600]">priority</p>
                  <p className="text-sm text-[#191C1D]">Enterprise Tier</p>
                </div>
                <div className="text-md font-semibold text-[#536600]">4-8h</div>
              </div>
            </div>

            <div className="p-5 text-xs bg-white rounded-xl">
              ""Our goal is architectural velocity— resolving complex network
              hurdles faster than the industry standard.""
            </div>
          </div>
        </div>

        {/* Self-Service Resources */}
        <div className="-mx-5 lg:-mx-20 bg-[url('/images/cloud.jpg')] bg-cover rounded-3xl overflow-hidden">
          <div
            className="flex flex-col items-center justify-between gap-10 p-5
            xl:flex-row xl:gap-20 xl:h-[500px] xl:px-25 xl:py-0"
          >
            <div className="flex flex-col gap-7 sm:gap-9 py-4 xl:py-0">
              <div className="w-fit text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14 text-white">
                Self-Service <span className="font-semibold">Resources</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  {
                    title: "Getting Started Guides",
                    desc: "Step-by-step walkthroughs to get your first network automation running in minutes.",
                    icon: <BookMarked size={26} className="text-[#003E68]" />,
                  },
                  {
                    title: "Best Practices",
                    desc: "Industry-vetted architectures and protocols for high-availability enterprise environments.",
                    icon: <BadgeCheck size={26} className="text-[#003E68]" />,
                  },
                  {
                    title: "Quick Fixes & FAQ",
                    desc: "Instant solutions for common configuration challenges and technical roadblocks.",
                    icon: <Bug size={26} className="text-[#003E68]" />,
                  },
                ].map((data, idx) => (
                  <div
                    key={data?.title || idx}
                    className="col-span-1 p-8 flex flex-col gap-2 bg-white rounded-3xl"
                  >
                    {data?.icon}

                    <div className="mt-2 font-semibold text-md text-[#191C1D]">
                      {data?.title}
                    </div>

                    <div className="text-xs text-[#41474F]">{data?.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* What we help with */}
        <div className="flex flex-col items-center gap-5">
          <Heading text="What We" underlinetext="Help With" />

          <p className="text-sm">
            Comprehensive technical expertise covering every facet of your
            network automation journey.
          </p>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                title: "Migration Assistance",
                icon: <SquareArrowRight size={18} className="text-[#003E68]" />,
                desc: [
                  "Onboarding from legacy infrastructure to AurionOne.",
                  "Data mapping and architectural validation.",
                  "Zero-downtime transition planning.",
                ],
              },
              {
                title: "Troubleshooting",
                icon: <Wrench size={18} className="text-[#003E68]" />,
                desc: [
                  "Rapid incident response and root cause analysis.",
                  "Network configuration error remediation.",
                  "Security vulnerability assessments.",
                ],
              },
              {
                title: "Platform Guidance",
                icon: <Compass size={18} className="text-[#003E68]" />,
                desc: [
                  "Best practices for automation workflow design.",
                  "Performance optimization and scaling strategies.",
                  "New feature walkthroughs and enablement.",
                ],
              },
            ].map((data, idx) => (
              <div
                key={data?.title || idx}
                className="col-span-1 space-y-5 p-8 text-[#003E68] bg-[#F3F4F5] rounded-3xl"
              >
                <div className="flex items-center gap-3">
                  {data?.icon}
                  <div className="font-semibold text-md">{data?.title}</div>
                </div>

                <div className="space-y-3">
                  {data?.desc?.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CircleCheck
                        size={18}
                        className="shrink-0 text-[#B4D33F]"
                      />
                      <p className="text-xs text-[#41474F]">{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
