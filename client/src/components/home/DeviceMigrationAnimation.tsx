const DeviceMigrationAnimation = ({
  devices = ["device-01", "device-02", "device-03", "device-04"],
  nodes = [
    { id: "node-01", status: "running" },
    { id: "node-02", status: "running" },
    { id: "node-03", status: "pending" },
    { id: "node-04", status: "pending" },
  ],
}) => {
  return (
    <svg width="100%" viewBox="0 0 680 260" role="img">
      <title>Device migration from on-premise to cloud</title>
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M2 1L8 5L2 9"
            fill="none"
            stroke="context-stroke"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
        <style>{`
        @keyframes travel {
          0%   { offset-distance: 0%;   opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @keyframes led { 0%,100%{opacity:.3} 50%{opacity:1} }
        .dm-dot { offset-path: path('M 198,130 C 290,130 390,130 462,130'); animation: travel 2.6s ease-in-out infinite; }
        .dm-l1 { animation: led 2s ease-in-out infinite 0s; }
        .dm-l2 { animation: led 2s ease-in-out infinite .4s; }
        .dm-l3 { animation: led 2s ease-in-out infinite .8s; }
        .dm-l4 { animation: led 2s ease-in-out infinite 1.2s; }
        @media (prefers-reduced-motion: reduce) {
          .dm-dot, .dm-l1, .dm-l2, .dm-l3, .dm-l4 { animation: none !important; }
        }
      `}</style>
      </defs>

      {/* ── On-premise rack ── */}
      <rect
        x="40"
        y="52"
        width="158"
        height="156"
        rx="10"
        fill="none"
        stroke="#B4B2A9"
        strokeWidth="0.5"
      />
      <rect
        x="40"
        y="52"
        width="158"
        height="18"
        rx="10"
        fill="#F1EFE8"
        stroke="#B4B2A9"
        strokeWidth="0.5"
      />
      <rect x="40" y="62" width="158" height="8" fill="#F1EFE8" />
      <text
        fontSize="12"
        x="119"
        y="64"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#888780"
      >
        On-premise
      </text>

      {devices.map((name, i) => {
        const y = 80 + i * 32;
        const ledColors = ["#1D9E75", "#1D9E75", "#EF9F27", "#1D9E75"];
        const ledClasses = ["dm-l1", "dm-l2", "dm-l3", "dm-l4"];
        return (
          <g key={name}>
            <rect
              x="52"
              y={y}
              width="134"
              height="26"
              rx="4"
              fill="#F1EFE8"
              stroke="#B4B2A9"
              strokeWidth="0.5"
            />
            <circle
              cx="64"
              cy={y + 13}
              r="3.5"
              fill={ledColors[i]}
              className={ledClasses[i]}
            />
            <text
              fontSize="12"
              x="80"
              y={y + 13}
              dominantBaseline="central"
              fill="#5F5E5A"
            >
              {name}
            </text>
          </g>
        );
      })}

      <rect
        x="52"
        y="210"
        width="134"
        height="8"
        rx="3"
        fill="#F1EFE8"
        stroke="#B4B2A9"
        strokeWidth="0.5"
      />
      {[60, 74, 88, 102].map((x) => (
        <rect
          key={x}
          x={x}
          y="212"
          width="10"
          height="4"
          rx="1"
          fill="#B4B2A9"
          opacity=".5"
        />
      ))}

      {/* ── Pipeline track ── */}
      <path
        d="M 198,130 C 290,130 390,130 462,130"
        fill="none"
        stroke="#B4B2A9"
        strokeWidth="1"
        strokeDasharray="5 4"
        opacity="0.25"
        markerEnd="url(#arrow)"
      />

      {/* Pipeline chip */}
      <rect
        x="282"
        y="112"
        width="116"
        height="36"
        rx="18"
        fill="#EEEDFE"
        stroke="#534AB7"
        strokeWidth="0.5"
      />
      <text
        fontSize="12"
        x="340"
        y="128"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#534AB7"
      >
        Automated pipeline
      </text>
      <text
        fontSize="12"
        x="340"
        y="142"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#7F77DD"
        opacity=".8"
      >
        zero-touch
      </text>

      {/* Animated dots */}
      <circle className="dm-dot" r="5.5" fill="#534AB7" />
      <circle
        className="dm-dot"
        r="5.5"
        fill="#534AB7"
        style={{ animationDelay: ".87s" }}
      />
      <circle
        className="dm-dot"
        r="4"
        fill="#AFA9EC"
        style={{ animationDelay: "1.74s" }}
      />

      {/* ── Cloud cluster ── */}
      <rect
        x="464"
        y="72"
        width="176"
        height="136"
        rx="24"
        fill="#F1EFE8"
        stroke="#B4B2A9"
        strokeWidth="0.5"
      />
      <text
        fontSize="14"
        fontWeight="500"
        x="552"
        y="96"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#2C2C2A"
      >
        Cloud cluster
      </text>

      {nodes.map((node, i) => {
        const x = i % 2 === 0 ? 480 : 556;
        const y = i < 2 ? 108 : 150;
        const isRunning = node.status === "running";
        return (
          <g key={node.id}>
            <rect
              x={x}
              y={y}
              width="64"
              height="34"
              rx="6"
              fill={isRunning ? "#E1F5EE" : "#F1EFE8"}
              stroke={isRunning ? "#0F6E56" : "#B4B2A9"}
              strokeWidth="0.5"
            />
            <text
              fontSize="12"
              x={x + 32}
              y={y + 12}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isRunning ? "#085041" : "#2C2C2A"}
            >
              {node.id}
            </text>
            <text
              fontSize="12"
              x={x + 32}
              y={y + 24}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isRunning ? "#0F6E56" : "#888780"}
              opacity=".8"
            >
              {node.status}
            </text>
          </g>
        );
      })}

      <text fontSize="12" x="119" y="242" textAnchor="middle" fill="#888780">
        Legacy infrastructure
      </text>
      <text fontSize="12" x="552" y="222" textAnchor="middle" fill="#888780">
        Target environment
      </text>
    </svg>
  );
};

export default DeviceMigrationAnimation;
