import React, { useState } from "react";

import {
  Rocket,
  Headset,
  Handshake,
  ArrowRight,
  MapPin,
  User,
  Mail,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";

import FormField from "@/src/components/ui/FormField";
import { CustomInput } from "@/src/components/ui/CustomInput";
import OvalButton from "../home/OvalButton";
import CustomSelect from "../ui/CustomSelect";
import { CustomDatepicker } from "../ui/CustomDatepicker";
import { CustomTextarea } from "../ui/CustomTextarea";
import { CustomTimepicker } from "../ui/CustomTimePicker";

export default function RequestDemoForm() {
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onChange" });

  const onSubmit = (payload: any) => {
    console.log("Form Payload: ", payload);
  };

  const handleNextStep = async (action: "next" | "prev") => {
    if (action === "next") {
      let fieldsToValidate: string[] = [];

      if (currentStep === 1) {
        fieldsToValidate = ["fullname", "email", "companyName"];
      }

      if (currentStep === 2) {
        fieldsToValidate = ["role", "intent", "scale", "timeline"];
      }

      const isValid = await trigger(fieldsToValidate);

      if (!isValid) return;
    }

    setCurrentStep((prev) =>
      action === "next" ? Math.min(prev + 1, 3) : Math.max(prev - 1, 1),
    );
  };

  return (
    <div className="p-8 flex flex-col gap-7 bg-white rounded-3xl">
      <div className="space-y-2">
        <p className="font-semibold text-lg text-[#003E68]">
          Tell us about your network in 30 seconds
        </p>
        <p className="text-[13px] sm:text-sm">
          We’ll show you exactly how to migrate it.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {currentStep === 1 && (
          <>
            <FormField
              id="fullname"
              label="Full Name"
              className="text-[13px] uppercase"
            >
              <CustomInput
                id="fullname"
                icon={User}
                placeholder="e.g. Jhon Doe"
                {...register("fullname", {
                  required: "Full Name is required!",
                })}
                error={errors?.fullname}
              />

              {errors?.fullname?.message && (
                <p className="text-xs text-red-600">
                  {String(errors.fullname.message)}
                </p>
              )}
            </FormField>

            <FormField
              id="email"
              label="Company Email"
              className="text-[13px] uppercase"
            >
              <CustomInput
                id="email"
                type="email"
                icon={Mail}
                placeholder="e.g. name@company.com"
                {...register("email", {
                  required: "Email is required!",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
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
              id="companyName"
              label="Company Name"
              className="text-[13px] uppercase"
            >
              <CustomInput
                id="companyName"
                icon={Building2}
                placeholder="e.g. Jhon Doe"
                {...register("companyName", {
                  required: "Company Name is required!",
                })}
                error={errors?.companyName}
              />

              {errors?.companyName?.message && (
                <p className="text-xs text-red-600">
                  {String(errors.companyName.message)}
                </p>
              )}
            </FormField>
          </>
        )}

        {currentStep === 2 && (
          <>
            <FormField
              id="role"
              label="Your Role"
              className="text-[13px] uppercase"
            >
              <Controller
                name="role"
                control={control}
                rules={{ required: "Role is required!" }}
                render={({ field }) => (
                  <CustomSelect
                    id="role"
                    placeholder="Select"
                    options={[
                      { label: "Network Engineer", value: "1" },
                      { label: "IT Manager", value: "2" },
                      { label: "CTO / CIO", value: "3" },
                      { label: "MSP / Partner", value: "4" },
                    ]}
                    value={field?.value}
                    onChange={field?.onChange}
                    error={!!errors?.role}
                  />
                )}
              />

              {errors?.role?.message && (
                <p className="text-xs text-red-600">
                  {String(errors.role.message)}
                </p>
              )}
            </FormField>

            <FormField
              id="intent"
              label="What are you looking to do?"
              className="text-[13px] uppercase"
            >
              <Controller
                name="intent"
                control={control}
                rules={{ required: "This field is required!" }}
                render={({ field }) => (
                  <CustomSelect
                    id="intent"
                    placeholder="Select"
                    options={[
                      { label: "Migrate Meraki networks", value: "1" },
                      { label: "Automate configurations", value: "2" },
                      { label: "Evaluate AurionOne", value: "3" },
                    ]}
                    value={field?.value}
                    onChange={field?.onChange}
                    error={!!errors?.intent}
                  />
                )}
              />

              {errors?.intent?.message && (
                <p className="text-xs text-red-600">
                  {String(errors.intent.message)}
                </p>
              )}
            </FormField>

            <FormField
              id="scale"
              label="No. of Devices"
              className="text-[13px] uppercase"
            >
              <Controller
                name="scale"
                control={control}
                rules={{ required: "No. of Devices is required" }}
                render={({ field }) => (
                  <CustomSelect
                    id="scale"
                    placeholder="Select"
                    options={[
                      { label: "1-10", value: "1" },
                      { label: "10-50", value: "2" },
                      { label: "50-200", value: "3" },
                      { label: "200+", value: "4" },
                    ]}
                    value={field?.value}
                    onChange={field?.onChange}
                    error={!!errors?.scale}
                  />
                )}
              />

              {errors?.scale?.message && (
                <p className="text-xs text-red-600">
                  {String(errors.scale.message)}
                </p>
              )}
            </FormField>

            <FormField
              id="timeline"
              label="Migration Timeline"
              className="text-[13px] uppercase"
            >
              <Controller
                name="timeline"
                control={control}
                rules={{ required: "Timeline is required!" }}
                render={({ field }) => (
                  <CustomSelect
                    id="timeline"
                    placeholder="Select"
                    options={[
                      { label: "Immediately", value: "1" },
                      { label: "Within 1 month", value: "2" },
                      { label: "1-3 months", value: "3" },
                    ]}
                    value={field?.value}
                    onChange={field?.onChange}
                    error={!!errors?.timeline}
                  />
                )}
              />

              {errors?.timeline?.message && (
                <p className="text-xs text-red-600">
                  {String(errors.timeline.message)}
                </p>
              )}
            </FormField>
          </>
        )}

        {currentStep === 3 && (
          <>
            <FormField
              id="description"
              label="Anything we should know?"
              className="text-[13px] uppercase"
            >
              <CustomTextarea
                id="description"
                placeholder="100 - 200 words"
                {...register("description")}
              />
            </FormField>

            <FormField
              id="date"
              label="Select Date"
              className="text-[13px] uppercase"
            >
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <CustomDatepicker
                    id="date"
                    icon
                    placeholder="Select"
                    value={field?.value}
                    onChange={field?.onChange}
                  />
                )}
              />
            </FormField>

            <FormField
              id="time"
              label="Select Time"
              className="text-[13px] uppercase"
            >
              <Controller
                name="time"
                control={control}
                render={({ field }) => (
                  <CustomTimepicker
                    id="time"
                    icon
                    placeholder="Select"
                    value={field?.value}
                    onChange={field?.onChange}
                  />
                )}
              />
            </FormField>
          </>
        )}
      </form>

      <div className="flex items-center justify-between gap-5">
        <OvalButton
          onClick={() => handleNextStep("prev")}
          bg_prop="bg-gray-100 hover:bg-gray-200"
          className="justify-center gap-2"
          disabled={currentStep === 1}
        >
          <ArrowLeft size={18} /> Prev
        </OvalButton>

        <OvalButton
          type={currentStep === 3 ? "submit" : "button"}
          onClick={() => handleNextStep("next")}
          className="justify-center gap-2"
        >
          {currentStep === 3 ? (
            "Submit"
          ) : (
            <>
              Next <ArrowRight size={18} />
            </>
          )}
        </OvalButton>
      </div>
    </div>
  );
}
