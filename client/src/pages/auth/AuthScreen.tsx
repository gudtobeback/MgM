import React, { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  Loader2,
  ArrowRight,
  Mail,
  User,
  Eye,
  EyeOff,
  LockKeyholeOpen,
} from "lucide-react";

import { apiEndpoints } from "@/src/services/api";

import FormField from "@/src/components/ui/FormField";
import { CustomInput } from "@/src/components/ui/CustomInput";
import { CustomInputPassword } from "@/src/components/ui/CustomInputPassword";

import { useAuth } from "@/src/context/AuthContext";
import { useForm } from "react-hook-form";

export const AuthScreen = () => {
  const { login } = useAuth();

  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldUnregister: true, // 🔥 IMPORTANT
  });

  const loginRegister = async (payload: any) => {
    try {
      let res;
      if (isLogin) {
        res = await apiEndpoints.login(payload);
      } else {
        res = await apiEndpoints.register(payload);
      }

      const data = res.data;

      if (data?.accessToken) {
        login(data?.user, data?.accessToken, data?.refreshToken);
      }

      console.log("Logged User Data: ", data?.user);
      navigate("/selection");
    } catch (error) {
      console.error("Error Logging In: ", error);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center">
      {/* Left Container */}
      <div className="overlay-bg relative bg-[url('/images/auth_page_image.png')] bg-cover w-full h-full lg:h-screen lg:w-1/2">
        <div className="relative z-10 flex flex-col gap-10 p-10 lg:p-16">
          <p
            onClick={() => navigate("/home")}
            className="font-semibold text-[18px] text-white cursor-pointer"
          >
            AurionOne
          </p>

          <p className="text-[28px] sm:text-[36px] md:text-[48px] leading-tight md:leading-14 text-white">
            <span className="font-medium text-[#D7FB71]">
              Automate Network Migrations
            </span>{" "}
            for the Next Generation
          </p>

          <p className="font-light text-[13px] sm:text-sm text-[#9BCBFF]">
            Automate network migrations with zero downtime, real-time
            validation, and intelligent execution—without manual effort.
          </p>
        </div>
      </div>

      {/* Right Container */}
      <div className="w-full lg:h-screen lg:w-1/2">
        <div className="flex flex-col justify-center gap-8 px-10 py-10 lg:px-30 h-full w-full">
          <div className="font-medium text-xl sm:text-2xl text-[#015C95]">
            {isLogin ? "Welcome Back" : "Create Your Free Account"}
          </div>

          {/* Inputs */}
          <form
            onSubmit={handleSubmit(loginRegister)}
            className="flex flex-col gap-4"
          >
            {!isLogin && (
              <FormField id="fullname" label="Full Name">
                <CustomInput
                  id="fullname"
                  icon={User}
                  placeholder="e.g. Jhon Doe"
                  {...register("fullname", {
                    required: "Full Name is required!",
                  })}
                />

                {errors?.fullname?.message && (
                  <p className="text-xs text-red-600">
                    {String(errors.fullname.message)}
                  </p>
                )}
              </FormField>
            )}

            <FormField id="email" label="Email Address">
              <CustomInput
                id="email"
                type="email"
                icon={Mail}
                placeholder="e.g. name@company.com"
                {...register("email", {
                  required: "Email is required!",
                })}
                error={errors?.email}
              />

              {errors?.email?.message && (
                <p className="text-xs text-red-600">
                  {String(errors?.email?.message)}
                </p>
              )}
            </FormField>

            <FormField
              id="password"
              label="Password"
              attachment={
                isLogin && (
                  <div className="font-medium text-xs text-[#015C95] cursor-pointer">
                    Forgot Password?
                  </div>
                )
              }
            >
              <CustomInputPassword
                id="password"
                icon={LockKeyholeOpen}
                placeholder="********"
                {...register("password", {
                  required: "Password is required!",
                })}
                error={errors?.password}
              />

              {errors?.password?.message && (
                <p className="text-xs text-red-600">
                  {String(errors?.password?.message)}
                </p>
              )}
            </FormField>

            <button
              type="submit"
              className="px-4 py-2.5 w-full flex items-center justify-center gap-2 font-medium text-md bg-[#D7FB71] rounded-full cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Get Started For Free"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {isLogin ? (
            <p className="font-semibold text-xs mx-auto">
              Don't have an account?{" "}
              <span
                onClick={() => setIsLogin(false)}
                className="text-[#015C95] cursor-pointer"
              >
                Sign Up
              </span>
            </p>
          ) : (
            <p className="font-semibold text-xs mx-auto">
              Already have an account?{" "}
              <span
                onClick={() => setIsLogin(true)}
                className="text-[#015C95] cursor-pointer"
              >
                Sign In
              </span>
            </p>
          )}

          {!isLogin && (
            <p className="text-center text-xs text-[#717781]">
              By creating an account, you agree to our{" "}
              <Link to="/terms" className="font-semibold underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy-policy" className="font-semibold underline">
                Privacy Policy
              </Link>
              . Your data is protected with enterprise-grade security and
              encryption.
            </p>
          )}

          <button
            onClick={() =>
              reset({ email: "admin@demo.com", password: "Admin1234!" })
            }
            className="mx-auto px-3 py-2 w-fit font-medium text-xs text-gray-500 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-md cursor-pointer"
          >
            Demo Credentails
          </button>
        </div>
      </div>
    </div>
  );
};
