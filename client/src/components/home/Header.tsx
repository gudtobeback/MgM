import React from "react";
import { useNavigate } from "react-router-dom";

import CustomButton from "../ui/CustomButton";

export default function Header() {
  const navigate = useNavigate();

  return (
    <nav className="relative lg:px-20 md:px-16 px-6 h-16 flex items-center justify-between bg-white text-black w-full shadow-md">
      <div className="text-[18px] font-semibold">Miraki Management</div>

      <div className="hidden md:flex items-center gap-8">
        <a
          href="#features"
          className="text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors"
        >
          Features
        </a>
        <a
          href="#how"
          className="text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors"
        >
          How it works
        </a>
        <a
          href="#pricing"
          className="text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors"
        >
          Pricing
        </a>
      </div>

      <div className="flex items-center gap-5">
        <button
          onClick={() => navigate("/auth")}
          className="hidden sm:block text-sm font-medium cursor-pointer"
        >
          Sign in
        </button>

        <CustomButton onClick={() => navigate("/auth")}>Get Started</CustomButton>
      </div>
    </nav>
  );
}
