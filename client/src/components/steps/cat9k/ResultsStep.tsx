import React from "react";

import {
  CheckCircle2,
  RotateCcw,
  Router,
  CircleAlert,
  ShieldCheck,
  Shield,
} from "lucide-react";

import LogsCard from "../LogsCard";
import StepHeadingCard from "../StepHeadingCard";

import CustomButton from "../../ui/CustomButton";

import { Cat9KData } from "../../../types/types";
import ProcedureCard from "../ProcedureCard";
import OvalButton from "../../home/OvalButton";

interface ResultsStepProps {
  data: Cat9KData;
  onReset: () => void;
}

export function ResultsStep({ data, onReset }: ResultsStepProps) {
  const results = data.results;

  if (!results) {
    return (
      <div className="text-center py-[60px] text-gray-500">
        No results available.
      </div>
    );
  }

  const stats = [
    {
      value: results.portsPushed,
      label: "Ports configured",
      icon: (
        <div className="p-2 bg-[#D0E4FF4D] rounded-full">
          <Router size={20} className="text-[#003E68]" />
        </div>
      ),
      badge: "SYNCED",
    },
    {
      value: results.portsFailed,
      label: "Ports skipped",
      icon: (
        <div className="p-2 bg-[#FEF3C7] rounded-full">
          <CircleAlert size={20} className="text-[#D97706]" />
        </div>
      ),
      badge: "BYPASSED",
    },
    {
      value: results.policiesCreated,
      label: "RADIUS policies",
      icon: (
        <div className="p-2 bg-[#D0F05933] rounded-full">
          <ShieldCheck size={20} className="text-[#536600]" />
        </div>
      ),
      badge: "ACTIVE",
    },
    {
      value: results.aclRulesPushed,
      label: "ACL rules pushed",
      icon: (
        <div className="p-2 bg-[#E0F2FE] rounded-full">
          <Shield size={20} className="text-[#0284C7]" />
        </div>
      ),
      badge: "PUSHED",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ProcedureCard
        icon={<CheckCircle2 size={30} className="text-green-600" />}
        heading="Configuration Applied"
        subHeading={`The IOS-XE configuration has been translated and pushed to ${data.destinationNetwork?.name ?? "the target network"}.`}
      />

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-6 flex flex-col gap-1 bg-white rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              {s?.icon}{" "}
              <p className="font-semibold text-xs text-[#41474F99]">
                {s?.badge}
              </p>
            </div>

            <div className="mt-3 font-semibold text-4xl text-[#003E68] leading-tight">
              {s.value}
            </div>

            <div className="font-medium text-sm text-[#41474F]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Logs */}
      <LogsCard logName="Operation Log">
        {results.log.map((line, i) => (
          <div
            key={i}
            className={
              line.startsWith("✅")
                ? "text-green-400"
                : line.startsWith("⚠️")
                  ? "text-yellow-400"
                  : line.startsWith("──")
                    ? "text-slate-400"
                    : "text-slate-200"
            }
          >
            {line || <br />}
          </div>
        ))}
      </LogsCard>

      <OvalButton onClick={onReset} className="w-fit">
        <RotateCcw size={14} />
        Start new migration
      </OvalButton>
    </div>
  );
}
