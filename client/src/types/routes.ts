/**
 * Route definitions based on ToolMode
 * Maps ToolMode to URL paths for proper routing
 */

export type ToolMode =
  | "selection"
  | "migration"
  | "backup"
  | "restore"
  | "version-control"
  | "organizations"
  | "drift"
  | "compliance"
  | "bulk-ops"
  | "dashboard"
  | "security"
  | "change-management"
  | "documentation"
  | "scheduler"
  | "cross-region"
  | "profile"
  | "cat9k"
  | "team";

export const TOOL_MODE_ROUTES: Record<ToolMode, string> = {
  selection: "/selection",
  migration: "/migration",
  backup: "/backup",
  restore: "/restore",
  "version-control": "/version-control",
  organizations: "/organizations",
  drift: "/drift",
  compliance: "/compliance",
  "bulk-ops": "/bulk-ops",
  dashboard: "/dashboard",
  security: "/security",
  "change-management": "/change-management",
  documentation: "/documentation",
  scheduler: "/scheduler",
  "cross-region": "/cross-region",
  profile: "/profile",
  cat9k: "/cat9k",
  team: "/team",
};

export const ROUTE_TO_TOOL_MODE: Record<string, ToolMode> = Object.entries(
  TOOL_MODE_ROUTES,
).reduce(
  (acc, [mode, path]) => {
    acc[path] = mode as ToolMode;
    return acc;
  },
  {} as Record<string, ToolMode>,
);

// Routes that require an organization to be connected
export const ORG_REQUIRED_ROUTES: ToolMode[] = [
  "version-control",
  "drift",
  "compliance",
  "bulk-ops",
  "security",
  "change-management",
  "documentation",
  "scheduler",
];
