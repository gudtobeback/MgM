import React, { useState } from "react";

import { message } from "antd";
import { CheckCircle2 } from "lucide-react";

import { TIERS } from "@/src/constants";

import { cn } from "../../lib/utils";

import { apiEndpoints } from "@/src/services/api";

import { useAuth } from "@/src/context/AuthContext";

export default function SubscriptionPage() {
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(false);

  const [changingTier, setChangingTier] = useState(false);
  const [error, setError] = useState("");

  const [messageApi, contextHolder] = message.useMessage();

  const loadProfile = async () => {
    // setLoading(true);
    try {
      const res = await apiEndpoints.getCurrentUser();

      const data = res.data;

      setUser(data);

      // console.log("User: ", data);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const changeTier = async (tierId: string) => {
    if (tierId === user?.subscription_tier) return;

    setChangingTier(true);
    setError("");

    try {
      await apiEndpoints.updateSubscription({ tier: tierId });
      const t = TIERS.find((t) => t.id === tierId);

      messageApi.open({
        type: "success",
        content: `Subscription changed to ${t?.label ?? tierId}.`,
      });

      await loadProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setChangingTier(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-6">
      {contextHolder}

      {/* ── Subscription plan selector ────────────────────────── */}
      <div className="p-5 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all">
        <p className="font-semibold text-foreground">Subscription Plan</p>

        <p className="text-xs text-muted-foreground mb-5">
          Select a plan below. Changes take effect immediately.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TIERS.map((tier) => {
            const isActive = user.subscription_tier === tier.id;

            return (
              <button
                key={tier.id}
                onClick={() => changeTier(tier.id)}
                disabled={changingTier || isActive}
                className={cn(
                  "relative p-4 rounded-xl text-left transition-all duration-200 border overflow-hidden group",
                  isActive
                    ? "border-transparent shadow-md ring-2 " + tier.ring
                    : "border-white/30 bg-white/20 hover:bg-white/40 hover:shadow-md hover:border-white/50",
                )}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${tier.from}18, ${tier.to}28)`,
                      }
                    : {}
                }
              >
                {/* Gradient top bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{
                    background: `linear-gradient(90deg, ${tier.from}, ${tier.to})`,
                  }}
                />

                <div className="flex items-center justify-between mt-1 mb-3">
                  <div className="flex items-center gap-2">
                    {/* Mini tier avatar */}
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${tier.from}, ${tier.to})`,
                      }}
                    >
                      {tier.id.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-foreground text-sm">
                      {tier.label}
                    </span>
                  </div>
                  {isActive && (
                    <span
                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${tier.from}, ${tier.to})`,
                      }}
                    >
                      <CheckCircle2 size={9} /> Current
                    </span>
                  )}
                </div>

                <ul className="space-y-1.5">
                  {tier.features.slice(0, 3).map((f) => (
                    <li
                      key={f}
                      className="text-xs text-muted-foreground flex items-start gap-1.5"
                    >
                      <CheckCircle2
                        size={11}
                        className="shrink-0 mt-0.5"
                        style={{ color: tier.from }}
                      />
                      {f}
                    </li>
                  ))}
                  {tier.features.length > 3 && (
                    <li className="text-xs text-muted-foreground pl-4">
                      +{tier.features.length - 3} more features
                    </li>
                  )}
                </ul>

                {!isActive && (
                  <div
                    className="mt-3 text-xs font-semibold text-center py-1.5 rounded-lg transition-colors group-hover:text-white"
                    style={{
                      background: `linear-gradient(135deg, ${tier.from}20, ${tier.to}20)`,
                      color: tier.from,
                    }}
                  >
                    Switch to {tier.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
