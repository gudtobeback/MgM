import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

import OvalButton from "./OvalButton";

export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isHome = pathname === "/" || pathname === "/home";
  const [isOpen, setIsOpen] = useState(false);

  const textColor = isHome ? "text-white" : "text-black";

  return (
    <>
      {/* HEADER (UNCHANGED) */}
      <nav
        className={`absolute top-0 left-0 w-full h-20 z-30 px-6 md:px-16 flex items-center justify-between transition-all duration-300
        ${
          isHome
            ? "bg-transparent md:bg-transparent"
            : "bg-white shadow-sm"
        }`}
      >
        {/* Logo */}
        <div
          onClick={() => navigate("/home")}
          className={`font-semibold text-[18px] ${textColor} cursor-pointer`}
        >
          AurionOne
        </div>

        {/* Desktop Menu */}
        <div className={`hidden md:flex items-center gap-8 ${textColor}`}>
          <a href="#features" className="text-[13px] hover:text-blue-600">
            Features
          </a>
          <a href="#how" className="text-[13px] hover:text-blue-600">
            How it works
          </a>
          <a href="#pricing" className="text-[13px] hover:text-blue-600">
            Pricing
          </a>
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-5">
          <button
            onClick={() => navigate("/auth")}
            className={`text-[13px] ${textColor}`}
          >
            Login
          </button>
          <OvalButton onClick={() => navigate("/auth")}>
            Get a Demo
          </OvalButton>
        </div>

        {/* Mobile Hamburger (UNCHANGED UI) */}
        <button
          className={`md:hidden ${textColor}`}
          onClick={() => setIsOpen(true)}
        >
          <Menu size={22} />
        </button>
      </nav>

      {/* BACKDROP (mobile only) */}
      <div
        className={`fixed inset-0 bg-black/30 md:hidden z-40 transition-opacity duration-300
        ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setIsOpen(false)}
      />

      {/* SIDE DRAWER (mobile only) */}
      <div
        className={`fixed top-0 right-0 h-full w-[260px] md:hidden z-50
        transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        ${isHome ? "bg-white text-black" : "bg-black text-white"}
        shadow-lg`}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-black/10">
          <span className="text-[14px] font-medium">Menu</span>
          <button onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Links (same spacing style as your dropdown) */}
        <div className="flex flex-col gap-6 px-6 py-6 text-[13px]">
          <a href="#features" onClick={() => setIsOpen(false)}>
            Features
          </a>
          <a href="#how" onClick={() => setIsOpen(false)}>
            How it works
          </a>
          <a href="#pricing" onClick={() => setIsOpen(false)}>
            Pricing
          </a>

          <button
            onClick={() => {
              navigate("/auth");
              setIsOpen(false);
            }}
            className="text-left"
          >
            Login
          </button>

          <OvalButton
            onClick={() => {
              navigate("/auth");
              setIsOpen(false);
            }}
          >
            Get a Demo
          </OvalButton>
        </div>
      </div>
    </>
  );
}