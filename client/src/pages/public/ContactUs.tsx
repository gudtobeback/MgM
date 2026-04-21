import React from "react";

import { Rocket, Headset, Handshake, ArrowRight } from "lucide-react";

import HeroSection from "@/src/components/public_pages/HeroSection";

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

export default function ContactUs() {
  return (
    <div className="flex flex-col gap-15">
      {/* Hero */}
      <HeroSection
        title="Contact Us"
        desc="Have questions, need support, or want to see AurionOne in action? Our team is here to help you every step of the way."
      />

      <div className="flex flex-col gap-16 mx-5 lg:mx-20">
        <div className="flex flex-col gap-10">
          <Heading text="Talk To" underlinetext="Us" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                title: "Sales & Demo Requests",
                desc: "Looking to explore how AurionOne can transform your network migrations?",
                icon: <Rocket size={18} />,
                email: "sales@aurionone.com",
                content: (
                  <div className="mt-4 flex items-center gap-2 font-medium text-sm text-[#003E68]">
                    Schedule a personalized demo{" "}
                    <span>
                      <ArrowRight size={12} />
                    </span>
                  </div>
                ),
              },
              {
                title: "Customer Support",
                desc: "Need help with setup, migration, or troubleshooting?",
                icon: <Headset size={18} />,
                email: "support@aurionone.com",
                content: (
                  <div className="mt-4 flex items-stretch gap-3 bg-white rounded-xl overflow-hidden">
                    <div className="p-0.5 bg-[#D0F059]"></div>

                    <div className="p-3 text-xs">
                      Note: Response time: Within 24 hours (priority support
                      available).
                    </div>
                  </div>
                ),
              },
              {
                title: "General Inquiries",
                desc: "For partnerships, collaborations, or general questions:",
                icon: <Handshake size={18} />,
                email: "info@aurionone.com",
              },
            ].map((data, idx) => (
              <div
                key={data?.title || idx}
                className="col-span-1 p-8 flex flex-col gap-2 bg-[#F3F4F5] rounded-3xl"
              >
                <div className="p-3 w-fit bg-[#D0F059] rounded-full">
                  {data?.icon}
                </div>

                <div className="mt-2 font-semibold text-md text-[#015C95]">
                  {data?.title}
                </div>

                <div className="text-xs text-[#41474F]">{data?.desc}</div>

                <div className="mt-5 space-y-1 text-[#015C95]">
                  <p className="text-xs uppercase">Email</p>
                  <p className="font-semibold text-sm">{data?.email}</p>
                </div>

                {data?.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
