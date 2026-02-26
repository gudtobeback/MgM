import React from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Cat9KData } from "../../../pages/private/migration/Cat9KMigrationWizard";
import CustomButton from "../../ui/CustomButton";

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
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <div className="flex items-center gap-2">
          <p className="text-[16px] font-semibold">Configuration Applied</p>

          <CheckCircle2 size={24} className="text-green-600 shrink-0" />
        </div>

        <p className="text-[12px] text-[#232C32]">
          The IOS-XE configuration has been translated and pushed to{" "}
          {data.destinationNetwork?.name ?? "the target network"}.
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="border border-gray-300 rounded-md px-4 py-4 bg-white text-center"
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
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[#333232]">Operation Log</p>

          <div className="h-80 p-4 font-mono text-sm text-[#D5D5D5] bg-black border border-[#B3B3B3] rounded-md overflow-y-auto">
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
          </div>
        </div>

        <CustomButton onClick={onReset} className="w-fit">
          <RotateCcw size={14} />
          Start new migration
        </CustomButton>
      </div>
    </div>
  );
}
