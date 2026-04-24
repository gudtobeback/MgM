import React from "react";
import { Progress } from "antd";
import { Check } from "lucide-react";

type StepBarProps = {
  steps?: any;
  currentStep?: any;
  className?: any;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function StepBar({
  steps,
  currentStep,
  className,
}: StepBarProps) {
  const ACTIVE_COLOR = "#049FD9";
  const COMPLETED_COLOR = "#059669";
  const INACTIVE_COLOR = "#9FA3AA";

  const activeIndex = steps.findIndex((s: any) => s.id === currentStep);
  const totalSteps = steps.length;

  // Each step label occupies (100/totalSteps)% of the row.
  // The center of the first label = half a step width from the left edge.
  // The center of the last label  = half a step width from the right edge.
  // The progress bar must start and end at these centers.
  const halfStep = 100 / totalSteps / 2; // % offset from each edge

  // Percentage of progress relative to the bar span (not the full container width)
  const percentage =
    activeIndex <= 0 ? 0 : Math.round((activeIndex / (totalSteps - 1)) * 100);

  return (
    <nav
      aria-label="Migration steps"
      className={`${className} w-full p-4 pb-9 bg-white border border-[#C1C7D11A] rounded-3xl shadow-[0_0_1px_0_rgba(0,0,0,0.25)]`}
    >
      <div className="flex items-start gap-1">
        {steps?.map((step: any, idx: any) => {
          const { id, name } = step;
          const isActive = activeIndex + 1 === id;
          const isComplete = id < activeIndex + 1;

          return (
            <>
              <div className="relative flex flex-col items-center gap-2 w-full text-xs">
                <div
                  className={`w-7 h-7 flex items-center justify-center ${isComplete ? "text-white bg-[#003E68]" : isActive ? "font-semibold text-[#003E68] bg-[#D0F059]" : "text-[#94A3B8] bg-[#EDEEEF]"}  rounded-full`}
                >
                  {isComplete ? <Check strokeWidth={3} size={16} /> : id}
                </div>

                <div
                  className={`absolute mt-9 text-nowrap text-[11px] ${isComplete ? "font-semibold text-[#003E68]" : isActive ? "font-semibold text-[#003E68]" : "text-[#94A3B8]"}`}
                >
                  {name}
                </div>
              </div>

              <div className="last:hidden mt-4 border-b border-[#EDEEEF] w-full"></div>
            </>
          );
        })}
      </div>
    </nav>
  );
}
