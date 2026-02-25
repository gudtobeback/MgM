import React from "react";

import { ArrowRight, Play, Check, Star } from "lucide-react";

import CustomButton from "../../ui/CustomButton";
import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const navigate = useNavigate();

  const capabilities = [
    {
      title: "Cross-region migration",
      description: "Global → India, China, Canada and more",
    },
    {
      title: "Pre-configure equipment",
      description:
        "Set up devices before installation with pre-config templates",
    },
    {
      title: "Bulk configuration updates",
      description: "Make changes across multiple networks simultaneously",
    },
    {
      title: "Rollback via clones",
      description: "Quick recovery with configuration backup and restore",
    },
    {
      title: "Bulk operations",
      description: "Execute batch operations across your entire network fleet",
    },
  ];

  const info = [
    { value: "99.9%", label: "Migration success" },
    { value: "~10 min", label: "Average time" },
    { value: "50+", label: "Config categories" },
  ];

  return (
    <div className="home-section">
      <div className="flex flex-col md:flex-row items-start justify-between gap-16">
        {/* Left */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-5 py-2 w-fit text-[12px] bg-[#E1EDFF] border border-[#049FD9] rounded-full">
            <span className="flex h-1 w-1 rounded-full bg-black"></span>
            Cisco Meraki Enterprise Platform
          </div>

          <h1 className="text-[36px] sm:text-[42px] font-bold text-foreground leading-[1.3] tracking-tight">
            <p>Migrate, manage, and audit.</p>
            <p>Meraki networks at scale.</p>
          </h1>

          <p className="text-[14px] text-muted-foreground leading-relaxed max-w-lg">
            A purpose-built operations platform for Cisco Meraki administrators.
            Cross-region migration, automated backup, configuration drift
            detection, and bulk operations — from one dashboard.
          </p>

          <div className="flex items-stretch gap-3">
            <div className="flex items-center gap-1">
              <Star className="text-yellow-400 fill-yellow-400" />
              <Star className="text-yellow-400 fill-yellow-400" />
              <Star className="text-yellow-400 fill-yellow-400" />
              <Star className="text-yellow-400 fill-yellow-400" />
              <Star className="text-yellow-400 fill-yellow-400" />

              <span className="ml-2 font-bold">4.9/5</span>
            </div>

            <div className="border border-gray-400"></div>

            <div className="">
              <span className="font-bold">500+</span> administrators trust
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <CustomButton onClick={() => navigate("/auth")}>
              Start migration <ArrowRight size={18} />
            </CustomButton>

            <CustomButton
              onClick={() => navigate("/auth")}
              text_prop="text-black"
              bg_prop="bg-white"
              className="border border-gray-300 shadow-[0_0px_2px_rgba(0,0,0,0.25)] hover:shadow-[0_0px_2px_rgba(0,0,0,0.50)]"
            >
              <Play
                size={20}
                className="p-1 text-white fill-white bg-gray-500 rounded-full"
              />
              Watch Demo
            </CustomButton>
          </div>

          <div className="border border-gray-300 my-2"></div>

          {/* Stats row */}
          <div className="flex items-center justify-between">
            {info?.map((s, idx) => (
              <div key={idx} className="flex-1 text-center">
                <div className="text-2xl font-bold text-foreground tracking-tight">
                  {s.value}
                </div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border-t-[3px] border-black overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100">
            <h2 className="text-[20px] font-bold text-gray-900 mb-1">
              Platform capabilities
            </h2>
            <p className="text-[12px] text-gray-500">
              Everything you need to migrate
            </p>
          </div>

          {/* Capabilities List */}
          <div className="divide-y divide-gray-50">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className="flex items-center gap-4 px-8 py-5 hover:bg-gray-50/70 transition-colors duration-200"
              >
                {/* Checkmark Icon */}
                <div className="p-1 rounded-full bg-cyan-500 shadow-sm">
                  <Check size={14} className="text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-gray-900 mb-1">
                    {capability.title}
                  </h3>
                  <p className="text-[12px] text-gray-600 leading-relaxed">
                    {capability.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
