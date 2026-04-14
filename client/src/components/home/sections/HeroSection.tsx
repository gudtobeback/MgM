import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowLeft } from "lucide-react";

import OvalButton from "../OvalButton";

export default function HeroSection() {
  const navigate = useNavigate();

  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <div className="relative rounded-b-3xl overflow-hidden">
        {/* Background Video */}
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/images/sky-animation.mp4" type="video/mp4" />
        </video>

        {/* Content */}
        <div className="relative flex items-center justify-center min-h-[500px] sm:min-h-[600px] px-6">
          <div className="flex flex-col gap-6 text-center text-white w-full max-w-[900px]">
            <p className="text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14">
              Automate Network Migrations
              <br className="hidden sm:block" />
              in Minutes, Not Days
            </p>

            <p className="font-light text-[12px] sm:text-[13px] max-w-[600px] mx-auto">
              Eliminate manual configs, reduce downtime, and scale operations
              effortlessly.
            </p>

            {/* Buttons */}
            <div className="flex items-center justify-center gap-4 sm:gap-5">
              {/* WATCH DEMO → opens overlay */}
              <OvalButton onClick={() => setShowDemo(true)}>
                <ArrowUpRight strokeWidth={1} size={18} />
                Watch Demo
              </OvalButton>

              <OvalButton
                onClick={() => navigate("/auth")}
                text_prop="text-white"
                bg_prop="bg-[#015C95]"
              >
                Explore More
              </OvalButton>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 FULLSCREEN VIDEO OVERLAY */}
      {showDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Back Button */}
          <button
            onClick={() => setShowDemo(false)}
            className="absolute top-5 left-5 z-10 text-white flex items-center gap-2 hover:opacity-80"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          {/* Video */}
          <video className="w-full h-full object-cover" autoPlay>
            <source src="/images/sky-animation.mp4" type="video/mp4" />
          </video>
        </div>
      )}
    </>
  );
}
