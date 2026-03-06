import React, { useState } from "react";

import { useNavigate } from "react-router-dom";
import { Input } from "antd";
import { Loader2, ArrowRight } from "lucide-react";

import LabelInput from "@/src/components/ui/LabelInput";
import CustomButton from "../../components/ui/CustomButton";

import { apiEndpoints } from "@/src/services/api";

import { useAuth } from "@/src/context/AuthContext";

const { Password } = Input;

export const AuthScreen = () => {
  const { login } = useAuth();

  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [sendPayload, setSendPayload] = useState({
    email: null,
    password: null,
    fullName: null,
  });

  const changePayload = (field: any, value: any) => {
    setSendPayload((prev) => ({ ...prev, [field]: value }));
  };

  const loginRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await apiEndpoints.login(sendPayload);
      } else {
        res = await apiEndpoints.register(sendPayload);
      }

      const data = res.data;

      if (data?.accessToken) {
        login(data?.user, data?.accessToken, data?.refreshToken);
      }

      console.log("Logged User Data: ", data?.user);
      navigate("/selection");
    } catch (error) {
      setError(error?.message);
      console.error("Error Logging In: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-slate-100 font-sans text-slate-800">
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        {/* Brand */}
        <div
          onClick={() => navigate("/home")}
          className="text-center cursor-pointer"
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            AegisOne<span className="text-[#049FD9]">Migrate</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise-grade network migration
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 flex flex-col gap-6">
          {/* Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                isLogin ? "bg-white shadow text-slate-900" : "text-slate-500"
              }`}
            >
              Sign In
            </button>

            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                !isLogin ? "bg-white shadow text-slate-900" : "text-slate-500"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Inputs */}
          <div className="flex flex-col gap-4">
            {!isLogin && (
              <LabelInput id="fullname" label="Full Name" required>
                <Input
                  id="fullname"
                  placeholder="Jane Doe"
                  value={sendPayload?.fullName}
                  onChange={(e) => changePayload("fullName", e.target.value)}
                />
              </LabelInput>
            )}

            <LabelInput id="email" label="Email" required>
              <Input
                id="email"
                type="email"
                placeholder="example@company.com"
                value={sendPayload?.email}
                onChange={(e) => changePayload("email", e.target.value)}
              />
            </LabelInput>

            <LabelInput id="password" label="Password" required>
              <Password
                id="password"
                placeholder="••••••••"
                value={sendPayload?.password}
                onChange={(e) => changePayload("password", e.target.value)}
              />
            </LabelInput>

            <CustomButton
              onClick={loginRegister}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight size={18} />
                </>
              )}
            </CustomButton>
          </div>
        </div>

        {/* Demo Access */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Quick Demo Access
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setSendPayload({
                  email: "admin@demo.com",
                  password: "Admin1234!",
                });
                setIsLogin(true);
              }}
              className="px-3 py-2 text-xs font-semibold rounded-md border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition"
            >
              Admin User
            </button>

            <button
              onClick={() => {
                setSendPayload({
                  email: "free@demo.com",
                  password: "Demo1234!",
                });
                setIsLogin(true);
              }}
              className="px-3 py-2 text-xs font-semibold rounded-md border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition"
            >
              Free User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
