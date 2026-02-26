import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient";
import {
  Globe2,
  ArrowLeftRight,
  Network,
  Cpu,
  Server,
  Wifi,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface OrgOption {
  id: string;
  meraki_org_id: string;
  meraki_org_name: string;
  meraki_region: string;
  device_count: number;
}

interface CrossRegionDiff {
  category: "networks" | "devices" | "vlans" | "ssids";
  item: string;
  sourceValue: any;
  targetValue: any;
  status: "only_in_source" | "only_in_target" | "differs";
}

interface CrossRegionReport {
  sourceOrg: { id: string; name: string; region: string };
  targetOrg: { id: string; name: string; region: string };
  generatedAt: string;
  summary: Record<string, number>;
  diffs: CrossRegionDiff[];
}

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
  only_in_source: { label: "Source Only", style: "bg-blue-100 text-blue-700" },
  only_in_target: {
    label: "Target Only",
    style: "bg-purple-100 text-purple-700",
  },
  differs: { label: "Differs", style: "bg-amber-100 text-amber-700" },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  networks: <Network size={18} />,
  devices: <Cpu size={18} />,
  vlans: <Server size={18} />,
  ssids: <Wifi size={18} />,
};

const SELECT =
  "w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/50 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all backdrop-blur-sm";

export const CrossRegionPage: React.FC = () => {
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [sourceOrgId, setSourceOrgId] = useState("");
  const [targetOrgId, setTargetOrgId] = useState("");
  const [report, setReport] = useState<CrossRegionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    setLoadingOrgs(true);
    try {
      const data = await apiClient.listCrossRegionOrgs();
      setOrgs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load organizations");
    } finally {
      setLoadingOrgs(false);
    }
  };

  const compare = async () => {
    if (!sourceOrgId || !targetOrgId) {
      setError("Please select both a source and target organization");
      return;
    }
    if (sourceOrgId === targetOrgId) {
      setError("Source and target organizations must be different");
      return;
    }
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const data = await apiClient.compareOrgs(sourceOrgId, targetOrgId);
      setReport(data);
      setCategoryFilter("all");
    } catch (err: any) {
      setError(err.message || "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredDiffs =
    report?.diffs.filter(
      (d) => categoryFilter === "all" || d.category === categoryFilter,
    ) ?? [];

  const regionBadge = (region: string) => (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
        region === "in"
          ? "bg-orange-100 text-orange-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      {region === "in" ? ".in" : ".com"}
    </span>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Globe2 size={20} className="text-purple-500" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Cross-Region Sync
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Compare configuration snapshots between .com and .in Meraki
          organizations to identify discrepancies.
        </p>
      </div>

      {error && (
        <div className="bg-red-50/80 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Org Selector */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-foreground mb-4">
          Select Organizations to Compare
        </h2>
        {loadingOrgs ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 size={14} className="animate-spin text-blue-500" />
            Loading organizations…
          </div>
        ) : orgs.length < 2 ? (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            You need at least two connected organizations to run a cross-region
            comparison. Connect organizations from the Organizations page first.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Source Organization
              </label>
              <select
                value={sourceOrgId}
                onChange={(e) => setSourceOrgId(e.target.value)}
                className={SELECT}
              >
                <option value="">Select source org…</option>
                {orgs
                  .filter((o) => o.id !== targetOrgId)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      [{o.meraki_region.toUpperCase()}] {o.meraki_org_name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-center pb-1">
              <div className="p-2 rounded-full bg-white/50 border border-white/40 text-muted-foreground">
                <ArrowLeftRight size={18} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Target Organization
              </label>
              <select
                value={targetOrgId}
                onChange={(e) => setTargetOrgId(e.target.value)}
                className={SELECT}
              >
                <option value="">Select target org…</option>
                {orgs
                  .filter((o) => o.id !== sourceOrgId)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      [{o.meraki_region.toUpperCase()}] {o.meraki_org_name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <button
                onClick={compare}
                disabled={loading || !sourceOrgId || !targetOrgId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
                }}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ArrowLeftRight size={14} />
                )}
                {loading ? "Comparing…" : "Compare Organizations"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {report && (
        <>
          {/* Org headers */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                label: "Source",
                org: report.sourceOrg,
                accent: "from-blue-500 to-cyan-500",
              },
              {
                label: "Target",
                org: report.targetOrg,
                accent: "from-purple-500 to-violet-500",
              },
            ].map(({ label, org, accent }) => (
              <div
                key={label}
                className="glass-card p-4 flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${label === "Source" ? "#3b82f6, #06b6d4" : "#a855f7, #7c3aed"})`,
                  }}
                >
                  <Globe2 size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">
                      {label}
                    </span>
                    {regionBadge(org.region)}
                  </div>
                  <p className="text-sm text-muted-foreground">{org.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-foreground mb-4">
              Comparison Summary
            </h2>
            {report.diffs.length === 0 ? (
              <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <svg
                  className="shrink-0 w-5 h-5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-medium">
                  Configurations are identical across both organizations.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["networks", "devices", "vlans", "ssids"] as const).map(
                  (cat) => {
                    const catDiffs = report.diffs.filter(
                      (d) => d.category === cat,
                    );
                    const isActive = categoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() =>
                          setCategoryFilter(isActive ? "all" : cat)
                        }
                        className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                          isActive
                            ? "border-blue-400 bg-blue-50/60 ring-2 ring-blue-200 shadow-sm"
                            : "border-white/40 bg-white/20 hover:bg-white/40 hover:border-white/60"
                        }`}
                      >
                        <div
                          className={`flex justify-center mb-1.5 ${isActive ? "text-blue-500" : "text-muted-foreground"}`}
                        >
                          {CATEGORY_ICONS[cat]}
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {catDiffs.length}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize mt-0.5">
                          {cat} differences
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>

          {/* Diff List */}
          {filteredDiffs.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/40">
                <h2 className="font-semibold text-foreground">
                  {categoryFilter === "all"
                    ? "All Differences"
                    : `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Differences`}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({filteredDiffs.length})
                  </span>
                </h2>
                {categoryFilter !== "all" && (
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Show all
                  </button>
                )}
              </div>

              <div className="divide-y divide-white/40">
                {filteredDiffs.map((diff, i) => (
                  <div key={i}>
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/30 transition-colors"
                      onClick={() =>
                        setExpandedIdx(expandedIdx === i ? null : i)
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-muted-foreground shrink-0">
                          {CATEGORY_ICONS[diff.category]}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {diff.item}
                          </p>
                          <span className="text-xs capitalize text-muted-foreground">
                            {diff.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[diff.status].style}`}
                        >
                          {STATUS_LABELS[diff.status].label}
                        </span>
                        <span className="text-muted-foreground">
                          {expandedIdx === i ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </span>
                      </div>
                    </div>

                    {expandedIdx === i && (
                      <div className="px-4 pb-4 pt-1">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-2">
                              Source ({report.sourceOrg.region.toUpperCase()})
                            </p>
                            {diff.sourceValue ? (
                              <pre className="text-xs text-blue-900 overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(diff.sourceValue, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-xs text-blue-500 italic">
                                Not present
                              </p>
                            )}
                          </div>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-purple-700 mb-2">
                              Target ({report.targetOrg.region.toUpperCase()})
                            </p>
                            {diff.targetValue ? (
                              <pre className="text-xs text-purple-900 overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(diff.targetValue, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-xs text-purple-500 italic">
                                Not present
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Comparison based on latest snapshots — Generated{" "}
            {new Date(report.generatedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
};
