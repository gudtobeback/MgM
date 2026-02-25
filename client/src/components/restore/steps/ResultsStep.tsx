import React from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { RestoreData } from "../RestoreWizard";
import CustomButton from "../../ui/CustomButton";

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
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[16px]">Restore Complete</p>

          <CheckCircle2 size={24} className="text-green-600" />
        </div>

        <p className="text-[12px] text-[#232C32]">
          Configuration has been pushed to{" "}
          {data.destinationNetwork?.name ?? "the target network"}.
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6">
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
              <div className="text-[11px] leading-[1.4]">
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
          </div>
        </div>

        {/* Actions */}
        <CustomButton onClick={onReset} className="w-fit">
          <RotateCcw size={14} />
          Start New Restore
        </CustomButton>
      </div>
    </div>
  );
}
