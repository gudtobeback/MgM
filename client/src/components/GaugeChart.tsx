import React, { useState, useEffect } from "react";

// 10-color palette for up to 10 segments
const SEGMENT_COLORS = [
  { stroke: "#16a34a", light: "#bbf7d0", label: "text-[#16a34a]" }, // green
  { stroke: "#ef4444", light: "#fecaca", label: "text-[#ef4444]" }, // red
  { stroke: "#f59e0b", light: "#fde68a", label: "text-[#f59e0b]" }, // amber
  { stroke: "#3b82f6", light: "#bfdbfe", label: "text-[#3b82f6]" }, // blue
  { stroke: "#a855f7", light: "#e9d5ff", label: "text-[#a855f7]" }, // purple
  { stroke: "#06b6d4", light: "#a5f3fc", label: "text-[#06b6d4]" }, // cyan
  { stroke: "#f97316", light: "#fed7aa", label: "text-[#f97316]" }, // orange
  { stroke: "#ec4899", light: "#fbcfe8", label: "text-[#ec4899]" }, // pink
  { stroke: "#14b8a6", light: "#99f6e4", label: "text-[#14b8a6]" }, // teal
  { stroke: "#6366f1", light: "#c7d2fe", label: "text-[#6366f1]" }, // indigo
];

export default function GaugeChart({ total = 12, segments = [] }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);

  // Build final segment list
  const segmentSum = segments.reduce((acc, s) => acc + s.count, 0);
  const others = total - segmentSum;
  const allSegments = [
    ...segments,
    ...(others > 0 ? [{ name: "Others", count: others }] : []),
  ].slice(0, 10);

  // Arc geometry
  const cx = 160;
  const cy = 155;
  const r = 108;

  const pointOnArc = (deg) => {
    const rad = ((180 - deg) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };

  const describeArc = (startDeg, endDeg) => {
    const s = pointOnArc(startDeg);
    const e = pointOnArc(endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`;
  };

  // Compute arc degree ranges per segment
  let cursor = 0;
  const arcSegments = allSegments.map((seg, i) => {
    const frac = total > 0 ? seg.count / total : 0;
    const startDeg = cursor;
    const endDeg = cursor + frac * 180;
    cursor = endDeg;
    return {
      ...seg,
      startDeg,
      endDeg,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    };
  });

  // Tick marks
  const ticks = [];
  for (let i = 0; i <= total; i++) {
    const deg = (i / total) * 180;
    const rad = ((180 - deg) * Math.PI) / 180;
    const isMajor =
      i === 0 ||
      i === total ||
      i === Math.round(total / 2) ||
      i === Math.round(total / 4) ||
      i === Math.round((total * 3) / 4);
    const outerR = r + 17;
    const innerR = r + (isMajor ? 5 : 10);
    ticks.push({
      x1: cx + outerR * Math.cos(rad),
      y1: cy - outerR * Math.sin(rad),
      x2: cx + innerR * Math.cos(rad),
      y2: cy - innerR * Math.sin(rad),
      isMajor,
      value: i,
    });
  }

  // Label positions (0, 25%, 50%, 75%, 100%)
  const labelVals = [
    0,
    Math.round(total / 4),
    Math.round(total / 2),
    Math.round((total * 3) / 4),
    total,
  ];
  const labelRadius = r + 32;

  return (
    <div className="flex flex-col items-center">
      {/* Gauge SVG */}
      <svg width="320" height="200" viewBox="0 0 320 200" overflow="visible">
        <defs>
          {arcSegments.map((seg, i) => (
            <linearGradient
              key={i}
              id={`grad-${i}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor={seg.color.stroke}
                stopOpacity="0.82"
              />
              <stop offset="100%" stopColor={seg.color.stroke} />
            </linearGradient>
          ))}
        </defs>

        {/* Track */}
        <path
          d={describeArc(0, 180)}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* Colored segments */}
        {arcSegments.map((seg, i) => {
          const end = animated ? seg.endDeg : seg.startDeg;
          const safeEnd = Math.max(seg.startDeg + 0.01, end);
          return (
            <path
              key={i}
              d={describeArc(seg.startDeg, safeEnd)}
              fill="none"
              stroke={`url(#grad-${i})`}
              strokeWidth="18"
              strokeLinecap="round"
              style={{
                transition: `d 0.75s cubic-bezier(0.34, 1.2, 0.64, 1) ${i * 0.08}s`,
              }}
            />
          );
        })}

        {/* Tick marks — on top of arcs */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.isMajor ? "#94a3b8" : "#cbd5e1"}
            strokeWidth={tick.isMajor ? 2 : 1.5}
            strokeLinecap="round"
          />
        ))}

        {/* Numeric labels at key positions */}
        {labelVals.map((val, i) => {
          const deg = total > 0 ? (val / total) * 180 : 0;
          const rad = ((180 - deg) * Math.PI) / 180;
          const lx = cx + labelRadius * Math.cos(rad);
          const ly = cy - labelRadius * Math.sin(rad);
          return (
            <text
              key={i}
              x={lx}
              y={ly + 4}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10.5"
              fontWeight="600"
              fill="#94a3b8"
            >
              {val}
            </text>
          );
        })}

        {/* Center total */}
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize="46"
          fontWeight="800"
          fill="#0f172a"
          style={{ letterSpacing: "-1px" }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize="10.5"
          fontWeight="600"
          fill="#94a3b8"
          letterSpacing="0.07em"
        >
          TOTAL DEVICES
        </text>
      </svg>

      {/* Dynamic legend */}
      <div className="flex items-center gap-5">
        {arcSegments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`font-bold text-lg ${seg.color.label}`}>
              {String(seg.count).padStart(2, "0")}
            </span>
            <span className="text-sm">
              {seg.name.charAt(0).toUpperCase() + seg.name.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
