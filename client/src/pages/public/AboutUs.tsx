import React from "react";

import HeroSection from "@/src/components/public_pages/HeroSection";
import {
  MapPin,
  Rocket,
  Eye,
  CircleCheck,
  Waypoints,
  Server,
  Shield,
} from "lucide-react";

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

export default function AboutUs() {
  return (
    <div className="flex flex-col gap-15">
      {/* Hero */}
      <HeroSection
        title="About Us"
        desc="AurionOne is a next-generation network automation platform designed to replace manual complexity with intelligent, high-speed architectural stability."
      />

      <div className="flex flex-col gap-16 mx-5 lg:mx-20">
        {/* Who We Are */}
        <div className="flex flex-col gap-5">
          <Heading text="Who" underlinetext="We Are" />

          <p className="text-sm text-[#000000CC] leading-relaxed">
            AurionOne is a next-generation network automation platform dedicated
            to transforming how modern enterprises manage their digital
            foundations. We bridge the gap between complex hardware ecosystems
            and the need for agile, error-free operations.
          </p>

          <div className="mt-2 flex items-stretch rounded-2xl overflow-hidden">
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

        {/* Innovation & Recognition */}
        <div className="flex flex-col gap-5">
          <Heading text="Innovations &" underlinetext="Recognition" />

          <div className="flex items-end justify-between">
            <p className="w-[400px] text-sm text-[#000000CC] leading-relaxed">
              Our commitment to innovation has been globally recognized. This
              recognition reflects our ability to build real-world solutions
              that solve complex enterprise challenges at scale.
            </p>

            <span className="hidden sm:block px-3 py-1.5 text-[11px] text-white bg-[#003E68] rounded-full">
              Award Year 2025
            </span>
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                bg_color: "bg-[#00568D]",
              },
            ].map((data) => (
              <div
                className={`col-span-1 w-full p-9 flex flex-col gap-3 ${data?.bg_color} rounded-3xl`}
              >
                <p className="font-medium text-sm text-[#D0F059]">
                  {data?.title}
                </p>
                <p className="text-[18px] text-white">{data?.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission & Vission */}
        <div className="-mx-5 lg:-mx-20 bg-[url('/images/cloud.jpg')] bg-cover rounded-3xl overflow-hidden">
          <div
            className="flex flex-col items-center justify-between gap-10 p-5
            xl:flex-row xl:gap-20 xl:h-[600px] xl:px-25 xl:py-0"
          >
            <div className="flex flex-col gap-7 sm:gap-9 py-4 xl:py-0 xl:w-[60%]">
              <div className="w-fit text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14 text-white">
                The Drive for{" "}
                <span className="font-semibold">Intelligent Velocity</span>
              </div>

              {[
                {
                  title: "Our Mission",
                  desc: "Replace manual processes with intelligent automation, ensuring every network action is precise and predictable.",
                  icon: <Rocket size={24} className="text-[#D0F059]" />,
                },
                {
                  title: "Our Vision",
                  desc: "To be the global leader in network automation platforms, setting the standard for enterprise architectural speed.",
                  icon: <Eye size={24} className="text-[#D0F059]" />,
                },
              ].map((data, idx) => (
                <div
                  key={data?.title || idx}
                  className="flex items-start gap-5 max-w-[500px]"
                >
                  <div className="shrink-0 mt-2 p-3 bg-[#D0F05933] rounded-full">
                    {data?.icon}
                  </div>

                  <div className="space-y-3 text-white">
                    <p className="font-semibold text-md">{data?.title}</p>
                    <p className="text-xs">{data?.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-5 p-8 w-fit xl:w-[40%] text-[#003E68] bg-[#D7FB71] rounded-3xl shadow-2xl">
              <div className="font-semibold text-2xl">What We Do</div>

              <div className="space-y-3">
                {[
                  "Automate complex operations",
                  "Eliminate human errors",
                  "Accelerate large-scale migrations",
                ]?.map((data, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CircleCheck size={18} className="shrink-0" />
                    <p className="font-medium text-md">{data}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Why AurionOne */}
        <div className="flex flex-col gap-5">
          <Heading text="Why" underlinetext="AurionOne" />

          <p className="text-sm text-[#000000CC] leading-relaxed">
            Our deep ecosystem alignment and proven frameworks make us the first
            choice for infrastructure-heavy enterprises.
          </p>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                title: "Cisco Ecosystem",
                desc: "Deep expertise in Cisco platforms, ensuring seamless integration with your existing stack.",
                icon: <Waypoints size={26} className="text-[#003E68]" />,
              },
              {
                title: "Proven Frameworks",
                desc: "Battle-tested automation logic that reduces time-to-value for network deployments.",
                icon: <Server size={26} className="text-[#003E68]" />,
              },
              {
                title: "Unmatched Reliability",
                desc: "Engineered for zero-downtime migrations and resilient operational governance.",
                icon: <Shield size={26} className="text-[#003E68]" />,
              },
            ].map((data, idx) => (
              <div
                key={data?.title || idx}
                className="col-span-1 p-8 flex flex-col gap-2 bg-[#F3F4F5] rounded-3xl"
              >
                {data?.icon}

                <div className="mt-2 font-semibold text-md text-[#003E68]">
                  {data?.title}
                </div>

                <div className="text-xs text-[#000000CC]">{data?.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
