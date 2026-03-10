import React, { useState } from "react";

import { Input, message } from "antd";
import { Loader2, Sparkles } from "lucide-react";

import AlertCard from "@/src/components/ui/AlertCard";
import LabelInput from "@/src/components/ui/LabelInput";
import CustomButton from "@/src/components/ui/CustomButton";

import { TIERS } from "@/src/constants";

import { apiClient } from "../../services/apiClient";

import { apiEndpoints } from "@/src/services/api";

import { useAuth } from "@/src/context/AuthContext";

const { Password } = Input;

export const ProfilePage = () => {
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

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

  const isAdmin = user?.role;
  const isSuperAdmin = user?.role == "super_admin";

  const currentTier = TIERS.find((t) => t.id === user?.subscription_tier);

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
            {!isSuperAdmin && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white tracking-wide shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${currentTier.from}, ${currentTier.to})`,
                }}
              >
                <Sparkles size={10} />
                {currentTier.label}
              </span>
            )}
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
            {!isSuperAdmin && (
              <>
                &nbsp;·&nbsp;Status:{" "}
                <span className="font-semibold text-green-600 capitalize">
                  {user.subscription_status}
                </span>
              </>
            )}
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
    </div>
  );
};
