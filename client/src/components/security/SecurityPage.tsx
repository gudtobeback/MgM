import React, { useState, useEffect } from 'react';
import {
  Shield, ShieldCheck, RefreshCw, Loader2, ChevronDown, ChevronUp,
  Lock, Wifi, Cpu, Settings, KeyRound, AlertTriangle,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { cn } from '../../lib/utils';

interface SecurityFinding {
  id: string;
  category: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedResource: string;
  resourceType: string;
  remediation: string;
  detectedAt: string;
}

interface SecurityPostureReport {
  organizationId: string;
  snapshotId: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  findings: SecurityFinding[];
  byCategory: Record<string, { count: number; criticalCount: number }>;
  checkedAt: string;
}

interface SecurityPageProps {
  organizationId: string;
  organizationName?: string;
}

const RISK_CONFIG = {
  low:      { label: 'Low Risk',      color: '#16a34a', bg: 'rgba(240,253,244,0.8)',  border: 'rgba(187,247,208,0.8)' },
  medium:   { label: 'Medium Risk',   color: '#d97706', bg: 'rgba(255,251,235,0.8)',  border: 'rgba(253,230,138,0.8)' },
  high:     { label: 'High Risk',     color: '#ea580c', bg: 'rgba(255,247,237,0.8)',  border: 'rgba(253,186,116,0.8)' },
  critical: { label: 'Critical Risk', color: '#dc2626', bg: 'rgba(254,242,242,0.8)',  border: 'rgba(254,202,202,0.8)' },
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100    text-red-800',
  high:     'bg-orange-100 text-orange-800',
  medium:   'bg-yellow-100 text-yellow-800',
  low:      'bg-blue-100   text-blue-700',
  info:     'bg-gray-100   text-gray-600',
};

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0, high: 1, medium: 2, low: 3, info: 4,
};

const CATEGORY_META: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  access_control:      { label: 'Access Control',      Icon: KeyRound, color: '#6366f1' },
  encryption:          { label: 'Encryption',          Icon: Lock,     color: '#0891b2' },
  network_segmentation:{ label: 'Network Segmentation',Icon: Wifi,     color: '#8b5cf6' },
  firmware:            { label: 'Firmware',            Icon: Cpu,      color: '#d97706' },
  configuration:       { label: 'Configuration',       Icon: Settings, color: '#059669' },
};

const DEFAULT_CAT = { label: 'Other', Icon: Settings, color: '#6b7280' };

export const SecurityPage: React.FC<SecurityPageProps> = ({ organizationId, organizationName }) => {
  const [report,          setReport]          = useState<SecurityPostureReport | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [activeCategory,  setActiveCategory]  = useState('all');

  useEffect(() => { runAnalysis(); }, [organizationId]);

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.getSecurityPosture(organizationId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run security analysis. Ensure you have at least one snapshot.');
    } finally {
      setLoading(false);
    }
  };

  const sortedFindings = [...(report?.findings ?? [])].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5)
  );

  const filteredFindings = sortedFindings.filter(
    f => activeCategory === 'all' || f.category === activeCategory
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield size={20} className="text-red-500" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Security Posture</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {organizationName ? `${organizationName} — ` : ''}Automated security analysis of your Meraki configuration.
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {loading ? 'Analyzing…' : 'Run Analysis'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-800 text-sm backdrop-blur-sm">
          <AlertTriangle size={15} className="shrink-0 text-amber-500" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground animate-pulse">
          <Loader2 size={40} className="mb-4 text-blue-500 opacity-50 animate-spin" />
          <p className="text-sm">Analyzing security posture…</p>
        </div>
      )}

      {!loading && report && (
        <>
          {/* Risk Overview */}
          <div
            className="glass-card p-5"
            style={{
              background: RISK_CONFIG[report.overallRisk].bg,
              borderColor: RISK_CONFIG[report.overallRisk].border,
            }}
          >
            <div className="flex items-center gap-6">
              {/* Score circle */}
              <div className="shrink-0 flex flex-col items-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center border-4 text-2xl font-bold"
                  style={{
                    borderColor: RISK_CONFIG[report.overallRisk].color,
                    color: RISK_CONFIG[report.overallRisk].color,
                  }}
                >
                  {report.riskScore}
                </div>
                <p className="text-xs font-semibold mt-1" style={{ color: RISK_CONFIG[report.overallRisk].color }}>
                  Risk Score
                </p>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <h2 className="text-xl font-bold" style={{ color: RISK_CONFIG[report.overallRisk].color }}>
                    {RISK_CONFIG[report.overallRisk].label}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {report.findings.length} finding{report.findings.length !== 1 ? 's' : ''} detected
                  </span>
                </div>

                {report.findings.filter(f => f.severity === 'critical').length > 0 && (
                  <p className="text-sm font-semibold text-red-700 mb-3">
                    {report.findings.filter(f => f.severity === 'critical').length} critical issue{report.findings.filter(f => f.severity === 'critical').length !== 1 ? 's' : ''} require immediate attention.
                  </p>
                )}

                {/* Category breakdown */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {(Object.entries(report.byCategory) as [string, { count: number; criticalCount: number }][]).map(([cat, counts]) => {
                    const meta = CATEGORY_META[cat] ?? DEFAULT_CAT;
                    const CatIcon = meta.Icon;
                    return (
                      <div
                        key={cat}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/50 border border-white/50 backdrop-blur-sm"
                      >
                        <CatIcon size={11} style={{ color: meta.color }} />
                        <span className="text-foreground">{meta.label}: <strong>{counts.count}</strong></span>
                        {counts.criticalCount > 0 && (
                          <span className="text-red-600 font-semibold">({counts.criticalCount} critical)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* All Clear */}
          {report.findings.length === 0 && (
            <div className="text-center py-14 border border-dashed border-green-200/60 bg-green-50/40 rounded-xl backdrop-blur-sm">
              <ShieldCheck size={44} className="mx-auto mb-3 text-green-500 opacity-80" />
              <h3 className="font-semibold text-green-800 text-lg">No Security Issues Found</h3>
              <p className="text-sm text-green-700 mt-1">Your configuration passes all automated security checks.</p>
            </div>
          )}

          {/* Findings */}
          {report.findings.length > 0 && (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                    activeCategory === 'all'
                      ? 'text-white shadow-sm'
                      : 'bg-white/40 border border-white/40 text-foreground hover:bg-white/60'
                  )}
                  style={activeCategory === 'all' ? { background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' } : {}}
                >
                  All ({report.findings.length})
                </button>
                {Object.entries(CATEGORY_META).map(([cat, meta]) => {
                  const count = report.findings.filter(f => f.category === cat).length;
                  if (count === 0) return null;
                  const CatIcon = meta.Icon;
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(isActive ? 'all' : cat)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                        isActive
                          ? 'text-white shadow-sm'
                          : 'bg-white/40 border border-white/40 text-foreground hover:bg-white/60'
                      )}
                      style={isActive ? { background: `linear-gradient(135deg, ${meta.color}, ${meta.color}dd)` } : {}}
                    >
                      <CatIcon size={12} />
                      {meta.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Finding cards */}
              <div className="space-y-2">
                {filteredFindings.map(finding => {
                  const meta    = CATEGORY_META[finding.category] ?? DEFAULT_CAT;
                  const CatIcon = meta.Icon;
                  const isOpen  = expandedFinding === finding.id;

                  return (
                    <div key={finding.id} className="glass-card overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/30 transition-colors"
                        onClick={() => setExpandedFinding(isOpen ? null : finding.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Severity badge */}
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold capitalize shrink-0', SEVERITY_STYLES[finding.severity])}>
                            {finding.severity}
                          </span>
                          {/* Category icon */}
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${meta.color}20`, color: meta.color }}
                          >
                            <CatIcon size={13} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{finding.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {meta.label} &bull; {finding.affectedResource}
                            </p>
                          </div>
                        </div>
                        <span className="text-muted-foreground ml-3 shrink-0">
                          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </span>
                      </div>

                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-white/40 pt-3 space-y-3">
                          <p className="text-sm text-foreground leading-relaxed">{finding.description}</p>
                          <div className="bg-blue-50/60 border border-blue-100/80 rounded-lg p-3 backdrop-blur-sm">
                            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">How to Fix</p>
                            <p className="text-sm text-blue-900 leading-relaxed">{finding.remediation}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Detected: {new Date(finding.detectedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Analysis completed: {new Date(report.checkedAt).toLocaleString()} &nbsp;·&nbsp; Snapshot: {report.snapshotId.slice(0, 8)}…
          </p>
        </>
      )}
    </div>
  );
};
