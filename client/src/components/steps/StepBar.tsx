import React from "react";
import { Progress } from "antd";

type StepBarProps = {
  steps?: any;
  currentStep?: any;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function StepBar({ steps, currentStep }: StepBarProps) {
  const ACTIVE_COLOR = "#049FD9";
  const COMPLETED_COLOR = "#10D830";
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
    <nav aria-label="Migration steps" className="w-full">
      {/* ── Progress bar — inset by halfStep% on each side to align with label centers ── */}
      <div
        style={{
          paddingLeft: `${halfStep}%`,
          paddingRight: `${halfStep}%`,
        }}
      >
        <Progress
          percent={percentage}
          strokeColor={{
            "0%": "#5BA4CF",
            "100%": "#52C17A",
          }}
          trailColor="#e5e7eb"
          strokeWidth={8}
          showInfo={false}
          style={{ display: "block", margin: 0 }}
          status="active"
        />
      </div>

      {/* ── Step names — evenly spaced, same total width as the container ── */}
      <div
        style={{
          display: "flex",
          marginTop: "6px",
        }}
      >
        {steps.map((step: any, index: number) => {
          const isCompleted = activeIndex > index;
          const isActive = activeIndex === index;

          const textColor = isActive
            ? ACTIVE_COLOR
            : isCompleted
              ? COMPLETED_COLOR
              : INACTIVE_COLOR;

          return (
            <div
              key={step.id}
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive || isCompleted ? 600 : 500,
                  color: textColor,
                  textAlign: "center",
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                  transition: "color 200ms",
                }}
              >
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
