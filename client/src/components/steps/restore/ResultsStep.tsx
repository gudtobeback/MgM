import React from "react";

import { CheckCircle2, RotateCcw } from "lucide-react";

import LogsCard from "../LogsCard";
import StepHeadingCard from "../StepHeadingCard";

import CustomButton from "../../ui/CustomButton";

import { RestoreData } from "../../../types/types";

interface ResultsStepProps {
  data: RestoreData;
  onReset: () => void;
}

export function ResultsStep({ data, onReset }: ResultsStepProps) {
  const results = data.results;

  if (!results) {
    return (
      <div className="py-[60px] text-center text-[var(--color-text-secondary)]">
        No results available.
      </div>
    );
  }

  const stats = [
    { value: results.restored, label: "Categories restored", warn: false },
    { value: results.failed, label: "Failures", warn: results.failed > 0 },
    {
      value:
        data.parsedBackup?.devices.reduce(
          (sum, d) => sum + (d.config.switchPorts?.length ?? 0),
          0,
        ) ?? 0,
      label: "Switch ports in backup",
      warn: false,
    },
  ];

  return (
    <div className="step-card-layout">
      {/* Heading */}
      <StepHeadingCard
        icon={<CheckCircle2 size={30} className="text-green-600" />}
        heading="Restore Complete"
        subHeading={`Configuration has been pushed to ${data.destinationNetwork?.name ?? "the target network"}.`}
      />

      <div className="step-card-inner-layout">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border px-5 py-5 text-center"
            >
              <div
                className={`mb-1 text-[26px] font-bold leading-[1.2] tracking-[-0.02em] ${
                  s.warn ? "text-amber-600" : ""
                }`}
              >
                {s.value}
              </div>
              <div className="text-[11px] leading-[1.4]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Logs */}
        <LogsCard logName="Operation Log">
          {results.log.map((line, i) => (
            <div
              key={i}
              className={`${
                line.startsWith("✅")
                  ? "text-green-400"
                  : line.includes("❌")
                    ? "text-red-400"
                    : line.startsWith("⚠️") || line.includes("⏩")
                      ? "text-yellow-400"
                      : line.startsWith("──")
                        ? "text-slate-400"
                        : "text-slate-200"
              }`}
            >
              {line || <br />}
            </div>
          ))}
        </LogsCard>

        {/* Actions */}
        <CustomButton onClick={onReset} className="w-fit">
          <RotateCcw size={14} />
          Start New Restore
        </CustomButton>
      </div>
    </div>
  );
}
