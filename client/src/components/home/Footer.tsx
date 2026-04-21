import React from "react";

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import OvalButton from "./OvalButton";

import { useFadeInOnScroll } from "@/src/hooks/useFadeInOnScroll";

export default function Footer() {
  const fadeRef = useFadeInOnScroll();

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isHome = pathname === "/" || pathname === "/home";

  const products = [
    {
      name: "Features",
      hash: "features",
    },
    {
      name: "Pricing",
      hash: "pricing",
    },
    {
      name: "How It Works",
      hash: "how",
    },
    {
      name: "Documentation",
      hash: "",
    },
    {
      name: "FAQ",
      hash: "FAQ",
    },
  ];

  const companys = [
    {
      name: "About Us",
      to: "/about_us",
    },
    {
      name: "Contact",
      to: "/contact_us",
    },
    {
      name: "Support",
      to: "/support",
    },
    {
      name: "Privacy Policy",
      to: "/privacy-policy",
    },
    {
      name: "Terms Of Service",
      to: "/terms",
    },
  ];

  const navigateToSection = (sectionId: string) => {
    if (isHome) {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/home#${sectionId}`);
    }
  };

  return (
    <div className="bg-[url('/images/cloud.jpg')] bg-cover rounded-t-3xl overflow-hidden p-5 mt-20">
      <div className="flex flex-col gap-10 md:gap-15">
        {/* Start */}
        <div className="flex flex-col items-center justify-center gap-5 p-6 bg-white rounded-2xl">
          <p className="font-medium text-center text-[28px] sm:text-[34px] leading-tight md:leading-12">
            Start Your First Migration Today
          </p>

          <p className="text-center text-[13px] sm:text-sm">
            No downtime. No risk. No manual effort. Just faster, smarter network
            operations.
          </p>

          <div className="flex items-center justify-center gap-5">
            <OvalButton
              onClick={() => navigate("/auth")}
              className="text-[13px] sm:text-sm"
            >
              <ArrowUpRight strokeWidth={1} size={20} /> Watch Demo
            </OvalButton>

            <OvalButton
              onClick={() => navigate("/auth")}
              text_prop="text-white"
              bg_prop="bg-[#015C95]"
              className="text-[13px] sm:text-sm"
            >
              Get a Demo
            </OvalButton>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-12 gap-6 md:gap-10 text-white">
          <div className="col-span-12 md:col-span-5 flex flex-col gap-1">
            <div className="font-bold text-[20px] mb-1">AurionOne</div>
            <p className="font-light text-xs text-white text-wrap">
              A purpose-built operations platform for Cisco Meraki
              administrators. Scale, modernize, and automate your network
              management without the manual work.
            </p>
          </div>

          <div className="col-span-6 md:col-span-2 flex flex-col gap-2">
            <div className="font-medium mb-1">Products</div>
            {products?.map((product, idx) => (
              <a
                key={idx}
                onClick={() => navigateToSection(product?.hash)}
                className="font-light text-xs hover:text-black cursor-pointer"
              >
                {product?.name}
              </a>
            ))}
          </div>

          <div className="col-span-6 md:col-span-2 flex flex-col gap-2">
            <div className="font-medium mb-1">Company</div>
            {companys?.map((company, idx) => (
              <NavLink
                key={idx}
                to={company?.to}
                className="font-light text-xs hover:text-black"
              >
                {company?.name}
              </NavLink>
            ))}
          </div>

          <div className="col-span-12 md:col-span-3 flex flex-col gap-2">
            <p className="font-light text-white">Subscribe our newsletter</p>

            <div className="p-1.5 flex items-center justify-between bg-white rounded-full">
              <div className="w-[150px]">
                <input
                  type="email"
                  placeholder="Enter your Email"
                  className="pl-2 text-sm text-black focus:outline-none focus:ring-0"
                />
              </div>

              <OvalButton onClick={() => navigate("/auth")}>
                <ArrowUpRight strokeWidth={1} size={20} /> Submit
              </OvalButton>
            </div>
          </div>
        </div>

        {/* Rights */}
        <div className="mx-auto sm:mx-0 font-light text-xs text-white">
          © 2026 AurionOne. All rights reserved.
        </div>
      </div>
    </div>
  );
}
