import React from "react";
import { useNavigate } from "react-router-dom";
import { Layers } from "lucide-react";

import { TIERS } from "@/src/constants";

import { TOOL_MODE_ROUTES } from "../../types/routes";

import { useAuth } from "@/src/context/AuthContext";
import { useOrganization } from "@/src/context/OrganizationContext";

export const TopBar = () => {
  const { user } = useAuth();

  const { selectedOrgName } = useOrganization();

  const navigate = useNavigate();

  const isAdmin = user?.role;
  const isSuperAdmin = user?.role == "super_admin";

  const email = user?.email || "";
  const initial = email[0]?.toUpperCase() || "?";
  const displayName = email.split("@")[0] || email;
  const userTier = user?.subscription_tier || "free";
  const tierStyle = TIERS?.find((tier) => tier?.id == userTier);

  return (
    <header className="relative flex items-center justify-between px-4 h-18 z-50 bg-white">
      {/* LEFT */}
      <div className="hidden sm:flex items-center gap-3">
        <Layers className="text-[#049FD9]" />

        <div className="flex flex-col">
          <p className="font-bold text-[20px] text-gray-800">
            AurionOne Platform
          </p>

          {/* <p className="text-[10px]">via Cisco Integration</p> */}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-5">
        {selectedOrgName && (
          <button
            onClick={() => navigate(TOOL_MODE_ROUTES.organizations)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 font-medium text-[12px] border rounded-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>

            <span className="truncate max-w-[160px]">{selectedOrgName}</span>
          </button>
        )}

        {!isSuperAdmin && (
          <span
            onClick={() => navigate(TOOL_MODE_ROUTES.subscription)}
            className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold text-white tracking-wider shadow-sm cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${tierStyle.from}, ${tierStyle.to})`,
            }}
          >
            {tierStyle.devices} Devices
          </span>
        )}

        <button
          onClick={() => navigate(TOOL_MODE_ROUTES.profile)}
          className="flex items-center gap-2 pl-1.5 pr-3 py-1 border border-[#B0AFAF] rounded-lg hover:bg-white/70 transition-all duration-200 group"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold bg-[#049FD9] shadow-md">
            {initial}
          </div>

          <div className="hidden md:block text-left">
            <div className="text-sm font-semibold leading-none text-gray-800 truncate max-w-[130px]">
              {displayName}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
