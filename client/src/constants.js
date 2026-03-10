const MERAKI_REGIONS = [
  {
    code: "com",
    name: "Global (Americas)",
    dashboard: "dashboard.meraki.com",
    confirmed: true,
  },
  {
    code: "in",
    name: "India",
    dashboard: "dashboard.meraki.in",
    confirmed: true,
  },
  {
    code: "cn",
    name: "China",
    dashboard: "dashboard.meraki.cn",
    confirmed: false,
  },
  {
    code: "ca",
    name: "Canada",
    dashboard: "dashboard.meraki.ca",
    confirmed: false,
  },
  {
    code: "uk",
    name: "United Kingdom",
    dashboard: "dashboard.meraki.uk",
    confirmed: false,
  },
  {
    code: "eu",
    name: "Europe",
    dashboard: "dashboard.meraki.eu",
    confirmed: false,
  },
  {
    code: "au",
    name: "Australia",
    dashboard: "dashboard.meraki.au",
    confirmed: false,
  },
  { code: "custom", name: "Custom URL", dashboard: "", confirmed: true },
];

const TIERS = [
  {
    id: "free",
    label: "Free",
    from: "#9ca3af",
    to: "#6b7280",
    ring: "ring-gray-300",
    features: [
      "Migration wizard",
      "Manual backups",
      "1 organization",
      "5 snapshots",
    ],
    devices: 10,
  },
  {
    id: "essentials",
    label: "Essentials",
    from: "#38bdf8",
    to: "#0ea5e9",
    ring: "ring-cyan-400",
    features: [
      "Everything in Free",
      "Version control",
      "Drift detection",
      "3 organizations",
      "30 snapshots",
    ],
    devices: 20,
  },
  {
    id: "professional",
    label: "Professional",
    from: "#a78bfa",
    to: "#7c3aed",
    ring: "ring-violet-400",
    features: [
      "Everything in Essentials",
      "Compliance checks",
      "Bulk operations",
      "Security posture",
      "10 organizations",
    ],
    devices: 30,
  },
  {
    id: "enterprise",
    label: "Enterprise",
    from: "#fbbf24",
    to: "#f59e0b",
    ring: "ring-amber-400",
    features: [
      "Everything in Professional",
      "Unlimited organizations",
      "Scheduled snapshots",
      "Change management",
      "Documentation export",
      "Cross-region sync",
    ],
    devices: 40,
  },
  {
    id: "msp",
    label: "MSP",
    from: "#3b82f6",
    to: "#4f46e5",
    ring: "ring-blue-500",
    features: [
      "Everything in Enterprise",
      "Multi-tenant management",
      "White-label",
      "Priority support",
    ],
    devices: 50,
  },
];

export { MERAKI_REGIONS, TIERS };
