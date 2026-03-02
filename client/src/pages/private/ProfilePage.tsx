import React, { useState, useEffect } from "react";
import {
  User,
  Key,
  CreditCard,
  CheckCircle2,
  Loader2,
  Sparkles,
  Shield,
} from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { cn } from "../../lib/utils";
import { apiEndpoints } from "@/src/services/api";
import { useAuth } from "@/src/context/AuthContext";
import AlertCard from "@/src/components/ui/AlertCard";
import LabelInput from "@/src/components/ui/LabelInput";
import { Input, message } from "antd";
import CustomButton from "@/src/components/ui/CustomButton";

const { Password } = Input;

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
}

const TIERS = [
  {
    id: "free",
    label: "Free",
    from: "#9ca3af",
    to: "#6b7280",
    ring: "ring-gray-300",
    features: [
      "Migration wizard",
      "Manual backups",
      "1 organization",
      "5 snapshots",
    ],
  },
  {
    id: "essentials",
    label: "Essentials",
    from: "#38bdf8",
    to: "#0ea5e9",
    ring: "ring-cyan-400",
    features: [
      "Everything in Free",
      "Version control",
      "Drift detection",
      "3 organizations",
      "30 snapshots",
    ],
  },
  {
    id: "professional",
    label: "Professional",
    from: "#a78bfa",
    to: "#7c3aed",
    ring: "ring-violet-400",
    features: [
      "Everything in Essentials",
      "Compliance checks",
      "Bulk operations",
      "Security posture",
      "10 organizations",
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    from: "#fbbf24",
    to: "#f59e0b",
    ring: "ring-amber-400",
    features: [
      "Everything in Professional",
      "Unlimited organizations",
      "Scheduled snapshots",
      "Change management",
      "Documentation export",
      "Cross-region sync",
    ],
  },
  {
    id: "msp",
    label: "MSP",
    from: "#3b82f6",
    to: "#4f46e5",
    ring: "ring-blue-500",
    features: [
      "Everything in Enterprise",
      "Multi-tenant management",
      "White-label",
      "Priority support",
    ],
  },
];

// Shared input style
const INPUT =
  "w-full px-3 py-2.5 rounded-lg text-sm bg-white/50 border border-white/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all backdrop-blur-sm";
const INPUT_DISABLED =
  "w-full px-3 py-2.5 rounded-lg text-sm bg-white/20 border border-white/30 text-muted-foreground opacity-70 cursor-not-allowed";

export const ProfilePage = () => {
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingTier, setChangingTier] = useState(false);
  const [error, setError] = useState("");
  // const [success, setSuccess] = useState("");
  const [nameForm, setNameForm] = useState(user?.full_name ?? "");
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });

  const [messageApi, contextHolder] = message.useMessage();

  const success = (content) => {
    messageApi.open({
      type: "success",
      content: content,
    });
  };

  const loadProfile = async () => {
    // setLoading(true);
    try {
      const res = await apiEndpoints.getCurrentUser();

      const data = res.data;

      setUser(data);
      setNameForm(data.full_name || "");
      // console.log("User: ", data);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const saveName = async () => {
    setSaving(true);
    setError("");

    try {
      await apiClient.updateProfile({ fullName: nameForm });
      success("Display name updated successfully.");

      await loadProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (pwForm.next !== pwForm.confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (pwForm.next.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      await apiClient.updateProfile({
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });

      setPwForm({ current: "", next: "", confirm: "" });

      success("Password changed successfully.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-pulse">
        <Loader2
          size={40}
          className="text-blue-500 opacity-50 animate-spin mb-4"
        />
        <p className="text-sm">Loading your profile...</p>
      </div>
    );
  }

  const currentTier =
    TIERS.find((t) => t.id === user?.subscription_tier) ?? TIERS[0];
  const initial = (user?.email?.[0] ?? "?").toUpperCase();
  const displayName = user?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="w-full flex flex-col gap-6 p-6">
      {contextHolder}

      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Account & Profile</p>
          <p className="text-xs text-black/60">
            Manage your account settings and subscription plan.
          </p>
        </div>
      </div>

      {/* ── Toast messages ────────────────────────────────────────── */}
      {error && (
        <AlertCard variant="error">
          <p className="font-semibold">{error}</p>
        </AlertCard>
      )}

      {/* ── Hero: avatar + identity + current plan ────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all">
        {/* Large avatar */}
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold shrink-0 bg-[#049FD9]"
          style={{
            boxShadow: `0 0 0 3px rgba(255,255,255,0.8), 0 0 0 5px #049FD950`,
          }}
        >
          {initial}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xl font-bold text-foreground truncate">
              {displayName}
            </p>

            {/* Tier badge */}
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white tracking-wide shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${currentTier.from}, ${currentTier.to})`,
              }}
            >
              <Sparkles size={10} />
              {currentTier.label}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {user.email}
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            Member since{" "}
            {new Date(user.created_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
            &nbsp;·&nbsp;Status:{" "}
            <span className="font-semibold text-green-600 capitalize">
              {user.subscription_status}
            </span>
          </p>
        </div>
      </div>

      {/* ── Profile information ───────────────────────────────── */}
      <div className="flex flex-col gap-5 p-5 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all">
        <p className="font-semibold text-foreground">Profile Information</p>

        {/* Email (read-only) */}
        <LabelInput id="email" label="Email Address">
          <Input id="email" type="email" value={user.email} disabled />
        </LabelInput>

        {/* Display name */}
        <LabelInput id="name" label="Full Name">
          <Input
            id="name"
            placeholder="Enter your name"
            value={nameForm}
            onChange={(e) => setNameForm(e.target.value)}
          />
        </LabelInput>

        <CustomButton
          onClick={saveName}
          disabled={saving || nameForm === (user.full_name ?? "")}
          className="self-end"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
        </CustomButton>
      </div>

      {/* ── Change password ───────────────────────────────────── */}
      <div className="flex flex-col gap-5 p-5 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all">
        <p className="font-semibold text-foreground">Change Password</p>

        <div className="grid grid-cols-1 gap-5">
          {(
            [
              { label: "Current password", key: "current" as const },
              { label: "New password", key: "next" as const },
              { label: "Confirm new password", key: "confirm" as const },
            ] as const
          ).map(({ label, key }) => (
            <div key={key}>
              <LabelInput id={key} label={label}>
                <Password
                  id={key}
                  value={pwForm[key]}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </LabelInput>
            </div>
          ))}
        </div>

        <CustomButton
          onClick={savePassword}
          disabled={saving || !pwForm.current || !pwForm.next}
          className="self-end"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving...
            </>
          ) : (
            "Update Password"
          )}
        </CustomButton>
      </div>

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
};
