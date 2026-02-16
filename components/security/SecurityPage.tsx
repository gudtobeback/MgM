import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

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
  low: { label: 'Low Risk', color: '#22c55e', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  medium: { label: 'Medium Risk', color: '#f59e0b', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
  high: { label: 'High Risk', color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
  critical: { label: 'Critical Risk', color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-700',
  info: 'bg-gray-100 text-gray-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  access_control: 'Access Control',
  encryption: 'Encryption',
  network_segmentation: 'Network Segmentation',
  firmware: 'Firmware',
  configuration: 'Configuration',
};

const CATEGORY_ICONS: Record<string, string> = {
  access_control: '🔐',
  encryption: '🔒',
  network_segmentation: '🌐',
  firmware: '⚙️',
  configuration: '📋',
};

export const SecurityPage: React.FC<SecurityPageProps> = ({ organizationId, organizationName }) => {
  const [report, setReport] = useState<SecurityPostureReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    runAnalysis();
  }, [organizationId]);

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

  const filteredFindings = report?.findings.filter(
    f => activeCategory === 'all' || f.category === activeCategory
  ) ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Security Posture</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {organizationName ? `${organizationName} — ` : ''}Automated security analysis of your Meraki configuration.
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <div className="animate-pulse text-4xl mb-3">🔒</div>
          <p className="text-[var(--color-text-secondary)]">Analyzing security posture...</p>
        </div>
      )}

      {!loading && report && (
        <>
          {/* Risk Overview */}
          <div className={`border rounded-xl p-6 ${RISK_CONFIG[report.overallRisk].bg} ${RISK_CONFIG[report.overallRisk].border}`}>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div
                  className="w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-bold"
                  style={{ borderColor: RISK_CONFIG[report.overallRisk].color, color: RISK_CONFIG[report.overallRisk].color }}
                >
                  {report.riskScore}
                </div>
                <p className="text-xs mt-1 font-medium" style={{ color: RISK_CONFIG[report.overallRisk].color }}>
                  Risk Score
                </p>
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold ${RISK_CONFIG[report.overallRisk].text}`}>
                  {RISK_CONFIG[report.overallRisk].label}
                </h3>
                <p className={`text-sm mt-1 ${RISK_CONFIG[report.overallRisk].text}`}>
                  {report.findings.length} security findings detected.
                  {report.findings.filter(f => f.severity === 'critical').length > 0 && (
                    <strong> {report.findings.filter(f => f.severity === 'critical').length} critical issues require immediate attention.</strong>
                  )}
                </p>
                {/* Category breakdown */}
                <div className="flex flex-wrap gap-3 mt-3">
                  {(Object.entries(report.byCategory) as [string, { count: number; criticalCount: number }][]).map(([cat, counts]) => (
                    <div key={cat} className="flex items-center gap-1.5 text-sm">
                      <span>{CATEGORY_ICONS[cat] ?? '⚙️'}</span>
                      <span className={RISK_CONFIG[report.overallRisk].text}>
                        {CATEGORY_LABELS[cat] || cat}: <strong>{counts.count}</strong>
                        {counts.criticalCount > 0 && <span className="text-red-700"> ({counts.criticalCount} critical)</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* All Clear */}
          {report.findings.length === 0 && (
            <div className="text-center py-12 border border-dashed border-green-200 bg-green-50 rounded-xl">
              <div className="text-4xl mb-3">🛡️</div>
              <h3 className="font-semibold text-green-800">No Security Issues Found</h3>
              <p className="text-sm text-green-700 mt-1">
                Your configuration passes all security checks.
              </p>
            </div>
          )}

          {/* Findings */}
          {report.findings.length > 0 && (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] border border-[var(--color-border-primary)]'}`}
                >
                  All ({report.findings.length})
                </button>
                {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                  const count = report.findings.filter(f => f.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] border border-[var(--color-border-primary)]'}`}
                    >
                      {CATEGORY_ICONS[cat]} {label} ({count})
                    </button>
                  );
                })}
              </div>

              {filteredFindings.map(finding => (
                <div key={finding.id} className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--color-surface-subtle)]"
                    onClick={() => setExpandedFinding(expandedFinding === finding.id ? null : finding.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${SEVERITY_STYLES[finding.severity]}`}>
                        {finding.severity}
                      </span>
                      <span className="text-lg">{CATEGORY_ICONS[finding.category] ?? '⚙️'}</span>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">{finding.title}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          {CATEGORY_LABELS[finding.category] || finding.category} &bull; {finding.affectedResource}
                        </p>
                      </div>
                    </div>
                    <span className="text-[var(--color-text-secondary)]">
                      {expandedFinding === finding.id ? '▲' : '▼'}
                    </span>
                  </div>
                  {expandedFinding === finding.id && (
                    <div className="px-4 pb-4 border-t border-[var(--color-border-primary)] pt-3 space-y-3">
                      <p className="text-sm text-[var(--color-text-primary)]">{finding.description}</p>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">How to Fix</p>
                        <p className="text-sm text-blue-800">{finding.remediation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-[var(--color-text-secondary)] text-center">
            Analysis completed: {new Date(report.checkedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
};
