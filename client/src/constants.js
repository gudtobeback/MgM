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

export { MERAKI_REGIONS };
