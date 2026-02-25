import React, { useState, useEffect } from 'react';
import {
  GitCompare, RefreshCw, Loader2, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Cpu, Network, Layers, Wifi,
  ShieldAlert, Settings, Copy, Check, Star, StarOff,
  Download, LayoutList, Code2, CalendarClock,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { cn } from '../../lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Snapshot {
  id: string;
  snapshotType: 'manual' | 'scheduled' | 'pre-change' | 'post-change';
  createdAt: string;
  notes?: string;
}

interface DriftItem {
  resourceType: string;
  resourceId: string;
  resourceName: string;
  changeType: 'added' | 'modified' | 'removed';
  field?: string;
  oldValue?: any;
  newValue?: any;
  detectedAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface DriftReport {
  organizationId: string;
  baselineSnapshotId: string;
  baselineSnapshotType: string;
  baselineCreatedAt: string;
  currentSnapshotId: string;
  currentCreatedAt: string;
  totalDrifts: number;
  criticalDrifts: number;
  highDrifts: number;
  drifts: DriftItem[];
  checkedAt: string;
}

interface DriftDetectionPageProps {
  organizationId: string;
  organizationName?: string;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high:     'bg-orange-100 text-orange-800 border-orange-200',
  medium:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  low:      'bg-blue-100 text-blue-700 border-blue-200',
};

const SEVERITY_BORDER: Record<string, string> = {
  critical: 'border-l-red-500',
  high:     'border-l-orange-500',
  medium:   'border-l-yellow-500',
  low:      'border-l-blue-400',
};

const CHANGE_BADGE: Record<string, string> = {
  added:    'text-green-700 bg-green-50 border border-green-200',
  modified: 'text-yellow-700 bg-yellow-50 border border-yellow-200',
  removed:  'text-red-700 bg-red-50 border border-red-200',
};

const RESOURCE_ICON: Record<string, React.ElementType> = {
  device:   Cpu,
  network:  Network,
  vlan:     Layers,
  ssid:     Wifi,
  firewall: ShieldAlert,
};

const TYPE_LABEL: Record<string, string> = {
  manual:     'Manual',
  scheduled:  'Scheduled',
  'pre-change':  'Pre-Change',
  'post-change': 'Post-Change',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const GOLDEN_KEY = (orgId: string) => `drift-golden-snapshot-${orgId}`;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export const DriftDetectionPage: React.FC<DriftDetectionPageProps> = ({ organizationId, organizationName }) => {
  const [snapshots,      setSnapshots]      = useState<Snapshot[]>([]);
  const [goldenId,       setGoldenId]       = useState<string>('');
  const [report,         setReport]         = useState<DriftReport | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [loadingSnaps,   setLoadingSnaps]   = useState(false);
  const [error,          setError]          = useState('');
  const [filter,         setFilter]         = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [viewMode,       setViewMode]       = useState<'visual' | 'json'>('visual');
  const [expandedDrifts, setExpandedDrifts] = useState<Set<number>>(new Set());
  const [copiedIdx,      setCopiedIdx]      = useState<number | null>(null);
  const [showSelector,   setShowSelector]   = useState(false);

  // Load persisted golden snapshot ID on mount / org change
  useEffect(() => {
    const saved = localStorage.getItem(GOLDEN_KEY(organizationId)) ?? '';
    setGoldenId(saved);
  }, [organizationId]);

  // Load snapshot list for the selector
  useEffect(() => {
    setLoadingSnaps(true);
    apiClient.listSnapshots(organizationId, { limit: 50 })
      .then(setSnapshots)
      .catch(() => {})
      .finally(() => setLoadingSnaps(false));
  }, [organizationId]);

  // Auto-run drift check when org or golden ID changes
  useEffect(() => { runDriftCheck(); }, [organizationId, goldenId]);

  const pinGolden = (snapshotId: string) => {
    localStorage.setItem(GOLDEN_KEY(organizationId), snapshotId);
    setGoldenId(snapshotId);
    setShowSelector(false);
  };

  const clearGolden = () => {
    localStorage.removeItem(GOLDEN_KEY(organizationId));
    setGoldenId('');
    setShowSelector(false);
  };

  const toggleExpand = (idx: number) => {
    setExpandedDrifts(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const copyDriftJson = (drift: DriftItem, idx: number) => {
    const payload = drift.changeType === 'modified'
      ? { before: drift.oldValue, after: drift.newValue }
      : { data: drift.oldValue ?? drift.newValue };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const runDriftCheck = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.detectDrift(organizationId, goldenId || undefined);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run drift detection. Make sure you have at least 2 snapshots.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDrifts = report?.drifts.filter(d => filter === 'all' || d.severity === filter) ?? [];

  const severityCounts = {
    critical: report?.drifts.filter(d => d.severity === 'critical').length ?? 0,
    high:     report?.drifts.filter(d => d.severity === 'high').length     ?? 0,
    medium:   report?.drifts.filter(d => d.severity === 'medium').length   ?? 0,
    low:      report?.drifts.filter(d => d.severity === 'low').length      ?? 0,
  };

  // Snapshot currently selected as golden (for display)
  const goldenSnapshot = snapshots.find(s => s.id === goldenId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <GitCompare size={20} className="text-blue-500" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Drift Detection</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {organizationName ? `${organizationName} — ` : ''}Compares the current config against a pinned golden config snapshot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* JSON / Visual toggle */}
          {report && (
            <div className="flex rounded-lg overflow-hidden border border-white/40 bg-white/30">
              <button
                onClick={() => setViewMode('visual')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all',
                  viewMode === 'visual' ? 'bg-white/60 text-foreground' : 'text-muted-foreground hover:bg-white/40'
                )}
              >
                <LayoutList size={12} /> Visual
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all',
                  viewMode === 'json' ? 'bg-white/60 text-foreground' : 'text-muted-foreground hover:bg-white/40'
                )}
              >
                <Code2 size={12} /> JSON
              </button>
            </div>
          )}
          {/* Export */}
          {report && (
            <button
              onClick={() => downloadJSON(report, `drift-report-${organizationId}-${new Date().toISOString().slice(0,10)}.json`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-white/40 bg-white/40 hover:bg-white/60 text-foreground transition-all"
            >
              <Download size={12} /> Export JSON
            </button>
          )}
          {/* Run check */}
          <button
            onClick={runDriftCheck}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {loading ? 'Scanning…' : 'Run Check'}
          </button>
        </div>
      </div>

      {/* ── Golden config panel ─────────────────────────────────────────────── */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50/80 border border-amber-200/60 shrink-0">
              <Star size={14} className="text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Golden Config (Baseline)</p>
              {goldenSnapshot ? (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  <span className="font-medium text-amber-700">{TYPE_LABEL[goldenSnapshot.snapshotType] ?? goldenSnapshot.snapshotType}</span>
                  {' — '}
                  <CalendarClock size={10} className="inline -mt-0.5 mr-0.5" />
                  {fmtDate(goldenSnapshot.createdAt)}
                  {goldenSnapshot.notes && <span className="ml-1 opacity-70">· {goldenSnapshot.notes}</span>}
                  {' — '}
                  <span className="font-mono opacity-60">{goldenId.slice(0, 8)}…</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  No golden config selected. Comparing the two most recent snapshots (not true drift detection).
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {goldenId && (
              <button
                onClick={clearGolden}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-white/40 bg-white/40 hover:bg-white/60 text-muted-foreground transition-all"
              >
                <StarOff size={11} /> Clear
              </button>
            )}
            <button
              onClick={() => setShowSelector(v => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <Star size={11} />
              {goldenId ? 'Change Golden' : 'Set Golden Config'}
            </button>
          </div>
        </div>

        {/* Snapshot selector dropdown */}
        {showSelector && (
          <div className="mt-4 border-t border-white/30 pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Select a snapshot to use as the golden config baseline
            </p>
            {loadingSnaps ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 size={13} className="animate-spin" /> Loading snapshots…
              </div>
            ) : snapshots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No snapshots found. Create one from Version Control first.</p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {snapshots.map(snap => {
                  const isSelected = snap.id === goldenId;
                  return (
                    <button
                      key={snap.id}
                      onClick={() => pinGolden(snap.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all border',
                        isSelected
                          ? 'bg-amber-50/80 border-amber-200/80 ring-1 ring-amber-300'
                          : 'bg-white/30 border-white/30 hover:bg-white/50'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CalendarClock size={13} className={isSelected ? 'text-amber-600' : 'text-muted-foreground'} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-xs font-semibold capitalize', isSelected ? 'text-amber-800' : 'text-foreground')}>
                              {TYPE_LABEL[snap.snapshotType] ?? snap.snapshotType}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">{snap.id.slice(0, 8)}…</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(snap.createdAt)}{snap.notes && ` · ${snap.notes}`}</p>
                        </div>
                      </div>
                      {isSelected && <Star size={13} className="text-amber-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-800 text-sm backdrop-blur-sm">
          <AlertTriangle size={15} className="shrink-0 text-amber-500" />
          {error}
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 size={40} className="mb-4 text-blue-500 opacity-50 animate-spin" />
          <p className="text-sm">Comparing snapshots for configuration drift…</p>
        </div>
      )}

      {/* ── Report ──────────────────────────────────────────────────────────── */}
      {!loading && report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{report.totalDrifts}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Changes</p>
            </div>
            {(['critical', 'high', 'medium'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setFilter(filter === sev ? 'all' : sev)}
                className={cn(
                  'glass-card p-4 text-center transition-all',
                  filter === sev && {
                    critical: 'ring-2 ring-red-400',
                    high:     'ring-2 ring-orange-400',
                    medium:   'ring-2 ring-yellow-400',
                  }[sev]
                )}
              >
                <p className={cn('text-3xl font-bold', {
                  critical: 'text-red-600',
                  high:     'text-orange-600',
                  medium:   'text-yellow-600',
                }[sev])}>{severityCounts[sev]}</p>
                <p className="text-sm text-muted-foreground mt-1 capitalize">{sev}</p>
              </button>
            ))}
          </div>

          {/* Comparison info strip */}
          <div className="glass-card px-4 py-3 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-0.5 flex items-center gap-1.5">
                <Star size={11} className="text-amber-500" /> Golden Config (Baseline)
              </p>
              <p>{fmtDate(report.baselineCreatedAt)}</p>
              <p className="font-mono opacity-60 mt-0.5">{report.baselineSnapshotId.slice(0, 8)}… · {TYPE_LABEL[report.baselineSnapshotType] ?? report.baselineSnapshotType}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-0.5 flex items-center gap-1.5">
                <CalendarClock size={11} className="text-blue-500" /> Current (Latest Snapshot)
              </p>
              <p>{fmtDate(report.currentCreatedAt)}</p>
              <p className="font-mono opacity-60 mt-0.5">{report.currentSnapshotId.slice(0, 8)}…</p>
            </div>
          </div>

          {/* ── JSON view ──────────────────────────────────────────────────── */}
          {viewMode === 'json' && (
            <div className="glass-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/30 bg-white/20">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Raw Drift Report — JSON</span>
                <button
                  onClick={() => downloadJSON(report, `drift-report-${organizationId}-${new Date().toISOString().slice(0,10)}.json`)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/60 border border-white/40 hover:bg-white/80 text-foreground transition-all"
                >
                  <Download size={11} /> Download
                </button>
              </div>
              <pre className="text-xs font-mono p-5 bg-gray-950/90 text-gray-200 overflow-auto max-h-[600px] leading-relaxed">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          )}

          {/* ── Visual view ────────────────────────────────────────────────── */}
          {viewMode === 'visual' && (
            <>
              {/* No drift */}
              {report.totalDrifts === 0 && (
                <div className="text-center py-14 border border-dashed border-green-200/60 bg-green-50/40 rounded-xl backdrop-blur-sm">
                  <CheckCircle2 size={44} className="mx-auto mb-3 text-green-500 opacity-80" />
                  <h3 className="font-semibold text-green-800 text-lg">No Drift Detected</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Configuration matches the golden config. No unauthorized changes found.
                  </p>
                </div>
              )}

              {/* Severity filter bar */}
              {report.totalDrifts > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => {
                    const count = sev === 'all' ? report.totalDrifts : severityCounts[sev];
                    const isActive = filter === sev;
                    return (
                      <button
                        key={sev}
                        onClick={() => setFilter(sev)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize',
                          isActive
                            ? 'text-white shadow-sm'
                            : 'bg-white/40 border border-white/40 text-muted-foreground hover:bg-white/60'
                        )}
                        style={isActive ? { background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' } : {}}
                      >
                        {sev === 'all' ? `All (${count})` : `${sev} (${count})`}
                      </button>
                    );
                  })}
                  {filter !== 'all' && (
                    <button onClick={() => setFilter('all')} className="text-xs text-blue-600 hover:underline px-2">
                      Clear filter
                    </button>
                  )}
                </div>
              )}

              {/* Drift item cards */}
              {filteredDrifts.length > 0 && (
                <div className="space-y-2">
                  {filteredDrifts.map((drift, idx) => {
                    const hasValues  = drift.oldValue !== undefined || drift.newValue !== undefined;
                    const isExpanded = expandedDrifts.has(idx);
                    const ResourceIcon = RESOURCE_ICON[drift.resourceType] ?? Settings;

                    return (
                      <div
                        key={idx}
                        className={cn(
                          'glass-card overflow-hidden border-l-4',
                          SEVERITY_BORDER[drift.severity] ?? 'border-l-gray-300',
                        )}
                      >
                        {/* Row header */}
                        <div className="flex items-start justify-between p-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/50 border border-white/40">
                              <ResourceIcon size={14} className="text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm">{drift.resourceName}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={cn('text-xs px-2 py-0.5 rounded-full border font-semibold capitalize', SEVERITY_BADGE[drift.severity])}>
                                  {drift.severity}
                                </span>
                                <span className={cn('text-xs px-2 py-0.5 rounded font-semibold capitalize', CHANGE_BADGE[drift.changeType])}>
                                  {drift.changeType}
                                </span>
                                <span className="text-xs text-muted-foreground capitalize">{drift.resourceType}</span>
                                {drift.field && (
                                  <span className="text-xs text-muted-foreground">
                                    field: <code className="bg-white/50 border border-white/40 px-1 rounded text-[10px] font-mono">{drift.field}</code>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className="text-xs text-muted-foreground">
                              {new Date(drift.detectedAt).toLocaleTimeString()}
                            </span>
                            {hasValues && (
                              <button
                                onClick={() => toggleExpand(idx)}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-white/40 bg-white/40 hover:bg-white/60 text-muted-foreground transition-colors"
                              >
                                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                {isExpanded ? 'Hide' : 'View'} JSON
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded JSON diff */}
                        {hasValues && isExpanded && (
                          <div className="border-t border-white/40">
                            <div className="flex items-center justify-between px-4 py-2 bg-white/30">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {drift.changeType === 'modified' ? 'JSON Diff (Before → After)' : 'JSON Data'}
                              </span>
                              <button
                                onClick={() => copyDriftJson(drift, idx)}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/60 border border-white/40 hover:bg-white/80 transition-colors text-foreground"
                              >
                                {copiedIdx === idx ? (
                                  <><Check size={11} className="text-green-500" /> Copied</>
                                ) : (
                                  <><Copy size={11} /> Copy</>
                                )}
                              </button>
                            </div>
                            {drift.changeType === 'modified' ? (
                              <div className="grid grid-cols-2 divide-x divide-white/40">
                                <div className="bg-red-50/60">
                                  <div className="px-4 py-2 border-b border-red-100/60">
                                    <span className="text-xs font-bold text-red-700">Before (Golden)</span>
                                  </div>
                                  <pre className="text-xs font-mono p-4 text-red-800 overflow-auto max-h-64 leading-relaxed">
                                    {JSON.stringify(drift.oldValue, null, 2)}
                                  </pre>
                                </div>
                                <div className="bg-green-50/60">
                                  <div className="px-4 py-2 border-b border-green-100/60">
                                    <span className="text-xs font-bold text-green-700">After (Current)</span>
                                  </div>
                                  <pre className="text-xs font-mono p-4 text-green-800 overflow-auto max-h-64 leading-relaxed">
                                    {JSON.stringify(drift.newValue, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <pre className="text-xs font-mono p-4 bg-gray-950/90 text-gray-300 overflow-auto max-h-64 leading-relaxed">
                                {JSON.stringify(drift.oldValue ?? drift.newValue, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Checked: {fmtDate(report.checkedAt)} &nbsp;·&nbsp; {report.totalDrifts} change{report.totalDrifts !== 1 ? 's' : ''} found
          </p>
        </>
      )}

      {/* ── No report yet ───────────────────────────────────────────────────── */}
      {!loading && !report && !error && (
        <div className="text-center py-16 border border-dashed border-white/40 bg-white/20 rounded-xl backdrop-blur-sm">
          <GitCompare size={44} className="mx-auto mb-3 text-blue-400 opacity-70" />
          <h3 className="font-semibold text-foreground text-lg">Ready to Scan</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Pin a golden config above, then click "Run Check" to detect unauthorized changes.
          </p>
        </div>
      )}
    </div>
  );
};
