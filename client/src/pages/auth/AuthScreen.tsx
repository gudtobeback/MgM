import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../services/apiClient";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { Checkbox } from "../../components/ui/checkbox";
import CustomButton from "../../components/ui/CustomButton";

interface AuthScreenProps {
  onSuccess: (user: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await apiClient.login(email, password);
      } else {
        result = await apiClient.register(email, password, fullName);
      }
      onSuccess(result.user);
      // Navigate to selection after successful login
      navigate("/selection");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f0f4f8] relative overflow-hidden font-sans text-slate-800">
      {/* ── Dynamic Light Background ─────────────────────────── */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[100px] animate-float delay-100" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[100px] animate-float delay-300" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-white/60 rounded-full blur-[80px]" />
      </div>

      {/* ── Main Glass Card ─────────────────────────── */}
      <div className="relative z-10 w-full max-w-[420px] animate-fade-in-up">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-5 animate-scale-in">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Meraki<span className="text-blue-600">Migrate</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 max-w-[280px]">
            The enterprise standard for network operations.
          </p>
        </div>

        {/* Card Body */}
        <div className="glass-card bg-white/70 backdrop-blur-2xl border border-white/60 shadow-xl shadow-slate-200/50 p-8 rounded-[2rem]">
          <div className="flex items-center justify-center gap-1 mb-8 p-1.5 bg-slate-100/50 rounded-xl border border-white/50 relative">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 relative z-10 ${
                isLogin
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 relative z-10 ${
                !isLogin
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              New Account
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in">
              <div className="w-1 h-4 bg-red-500 rounded-full mt-1 shrink-0" />
              <p className="text-xs font-semibold text-red-600 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="animate-fade-in space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Full Name
                </Label>
                <Input
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="h-12 bg-white/50 border-slate-200 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Email
              </Label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white/50 border-slate-200 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Password
                </Label>
                {isLogin && (
                  <a
                    href="#"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot?
                  </a>
                )}
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-white/50 border-slate-200 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {isLogin && (
              <div className="flex items-center space-x-2 py-1 ml-1">
                <Checkbox
                  id="remember"
                  className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                >
                  Remember me for 30 days
                </label>
              </div>
            )}

            <CustomButton
              type="submit"
              className="w-full h-12 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] hover:shadow-blue-500/40 mt-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-5 h-5 ml-2 opacity-60" />
                </>
              )}
            </CustomButton>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <Sparkles size={14} className="text-amber-400" />
              <span>Powered by </span>
              <span className="font-bold text-slate-600">
                Antigravity Core v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Demo Credentials Footer */}
        <div className="mt-8 mx-auto max-w-[340px] animate-fade-in delay-200">
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Quick Demo Access
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setEmail("admin@demo.com");
                  setPassword("Admin1234!");
                  setIsLogin(true);
                }}
                className="px-4 py-2 bg-white rounded-lg text-xs font-semibold text-slate-600 shadow-sm border border-slate-100 hover:text-blue-600 hover:border-blue-200 transition-colors"
              >
                Admin User
              </button>
              <button
                onClick={() => {
                  setEmail("free@demo.com");
                  setPassword("Demo1234!");
                  setIsLogin(true);
                }}
                className="px-4 py-2 bg-white rounded-lg text-xs font-semibold text-slate-600 shadow-sm border border-slate-100 hover:text-blue-600 hover:border-blue-200 transition-colors"
              >
                Free User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
