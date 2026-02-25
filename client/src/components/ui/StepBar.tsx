import React from "react";

type StepBarProps = {
  steps?: any;
  currentStep?: any;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function StepBar({ steps, currentStep }: StepBarProps) {
  const COMPLETED_COLOR = "#10D830";
  const ACTIVE_COLOR = "#049FD9";
  const INACTIVE_COLOR = "#9FA3AA";
  const INACTIVE_TEXT = "#9FA3AA";

  const activeIndex = steps.findIndex((s) => s.id === currentStep);
  const totalSteps = steps.length;

  // Each step column takes (100 / totalSteps)% of the width.
  // The center of the first dot is at (100 / totalSteps / 2)% from the left.
  // The center of the last dot is at (100 - 100 / totalSteps / 2)% from the left.
  // So the bar must start and end at those centers.
  const stepWidth = 100 / totalSteps; // % width each step occupies
  const barStart = stepWidth / 2; // % — center of first dot
  const barEnd = 100 - stepWidth / 2; // % — center of last dot
  const barTotalWidth = barEnd - barStart; // % — full bar span

  // Green bar goes from barStart to center of the active dot.
  // Center of activeIndex dot = barStart + activeIndex * stepWidth
  // So green bar width = activeIndex * stepWidth (as % of container)
  const greenBarWidth =
    activeIndex <= 0 ? 0 : (activeIndex / (totalSteps - 1)) * barTotalWidth;

  return (
    <nav aria-label="Migration steps" className="overflow-x-auto no-scrollbar">
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        {/* ── Gray track bar — starts at center of 1st dot, ends at center of last dot ── */}
        <div
          style={{
            position: "absolute",
            top: "7px",
            left: `${barStart}%`,
            width: `${barTotalWidth}%`,
            height: "1px",
            backgroundColor: INACTIVE_COLOR,
            borderRadius: "1px",
            zIndex: 0,
          }}
        />

        {/* ── Green progress bar — same origin, width grows with activeIndex ── */}
        <div
          style={{
            position: "absolute",
            top: "7px",
            left: `${barStart}%`,
            width: `${greenBarWidth}%`,
            height: "2px",
            backgroundColor: COMPLETED_COLOR,
            borderRadius: "1px",
            zIndex: 1,
            transition: "width 300ms ease",
          }}
        />

        {/* ── Step nodes ── */}
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          const dotBorder = isCompleted
            ? COMPLETED_COLOR
            : isActive
              ? ACTIVE_COLOR
              : INACTIVE_COLOR;

          const textColor = isActive
            ? ACTIVE_COLOR
            : isCompleted
              ? COMPLETED_COLOR
              : INACTIVE_TEXT;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center"
              style={{ flex: 1, zIndex: 2, position: "relative" }}
            >
              {/* Dot */}
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: dotBorder,
                  border: `2.5px solid ${dotBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 200ms",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: dotBorder,
                    border: `3.5px solid white`,
                  }}
                />
              </div>

              {/* Step label */}
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive || isCompleted ? 600 : 500,
                  marginTop: "6px",
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
