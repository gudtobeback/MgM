import React from "react";

import { CheckCircle2, RotateCcw } from "lucide-react";

import LogsCard from "../LogsCard";
import StepHeadingCard from "../StepHeadingCard";

import CustomButton from "../../ui/CustomButton";

import { Cat9KData } from "../../../types/types";
import ProcedureCard from "../ProcedureCard";

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
    { value: results.portsPushed, label: "Ports configured" },
    { value: results.portsFailed, label: "Ports skipped" },
    { value: results.policiesCreated, label: "RADIUS policies" },
    { value: results.aclRulesPushed, label: "ACL rules pushed" },
  ];

  return (
    <div className="step-card-inner-layout">
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
            className="border border-[#87D2ED] rounded-md px-4 py-4 bg-white text-center"
          >
            <div
              className={`text-[26px] font-bold tracking-tight leading-tight mb-1 ${
                s.label === "Ports skipped" && s.value > 0
                  ? "text-amber-600"
                  : "text-gray-900"
              }`}
            >
              {s.value}
            </div>

            <div className="text-[11px] text-gray-500 leading-snug">
              {s.label}
            </div>
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

      <CustomButton onClick={onReset} className="w-fit">
        <RotateCcw size={14} />
        Start new migration
      </CustomButton>
    </div>
  );
}
