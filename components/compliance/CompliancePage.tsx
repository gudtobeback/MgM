import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface ComplianceViolation {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resourceType: string;
  resourceId: string;
  resourceName: string;
  description: string;
  remediation: string;
}

interface ComplianceReport {
  organizationId: string;
  snapshotId: string;
  score: number;
  totalChecks: number;
  passed: number;
  failed: number;
  violations: ComplianceViolation[];
  byCategory: Record<string, { passed: number; failed: number }>;
  checkedAt: string;
}

interface CompliancePageProps {
  organizationId: string;
  organizationName?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'pci-dss': 'PCI DSS',
  'hipaa': 'HIPAA',
  'cis': 'CIS Benchmark',
  'general': 'Best Practices',
};

const CATEGORY_COLORS: Record<string, string> = {
  'pci-dss': 'from-red-500 to-red-600',
  'hipaa': 'from-blue-500 to-blue-600',
  'cis': 'from-purple-500 to-purple-600',
  'general': 'from-green-500 to-green-600',
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-700',
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'At Risk';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${score} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold mt-2" style={{ color }}>{label}</span>
    </div>
  );
}

export const CompliancePage: React.FC<CompliancePageProps> = ({ organizationId, organizationName }) => {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedViolation, setExpandedViolation] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    runComplianceCheck();
  }, [organizationId]);

  const runComplianceCheck = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.runComplianceCheck(organizationId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run compliance checks. Ensure you have at least one snapshot.');
    } finally {
      setLoading(false);
    }
  };

  const filteredViolations = report?.violations.filter(
    v => activeCategory === 'all' || v.category === activeCategory
  ) ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Compliance Monitoring</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {organizationName ? `${organizationName} — ` : ''}Automated checks against PCI DSS, HIPAA, and CIS benchmarks.
          </p>
        </div>
        <button
          onClick={runComplianceCheck}
          disabled={loading}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Run Checks'}
        </button>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-[var(--color-text-secondary)]">
          <div className="animate-pulse text-4xl mb-3">🛡️</div>
          <p>Running compliance checks...</p>
        </div>
      )}

      {!loading && report && (
        <>
          {/* Overall Score + Category Breakdown */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6">
            <div className="flex items-center gap-10">
              <ScoreGauge score={report.score} />
              <div className="flex-1">
                <div className="flex items-center gap-6 mb-4">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{report.passed}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">Checks Passed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{report.failed}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">Checks Failed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{report.violations.length}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">Violations Found</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(report.byCategory).map(([cat, counts]) => {
                    const catTotal = counts.passed + counts.failed;
                    const catScore = catTotal > 0 ? Math.round((counts.passed / catTotal) * 100) : 100;
                    return (
                      <div key={cat} className="text-center p-3 bg-[var(--color-surface-subtle)] rounded-lg">
                        <div className={`text-xs font-bold text-white px-2 py-1 rounded bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-500 to-gray-600'} mb-2`}>
                          {CATEGORY_LABELS[cat] || cat}
                        </div>
                        <p className="text-lg font-bold">{catScore}%</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{counts.passed}/{catTotal} passed</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* No violations */}
          {report.violations.length === 0 && (
            <div className="text-center py-12 border border-dashed border-green-200 bg-green-50 rounded-xl">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-semibold text-green-800">Fully Compliant</h3>
              <p className="text-sm text-green-700 mt-1">
                All {report.totalChecks} compliance checks passed. Great work!
              </p>
            </div>
          )}

          {/* Violations */}
          {report.violations.length > 0 && (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] border border-[var(--color-border-primary)]'}`}
                >
                  All ({report.violations.length})
                </button>
                {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                  const count = report.violations.filter(v => v.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] border border-[var(--color-border-primary)]'}`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>

              {filteredViolations.map((violation, idx) => (
                <div key={idx} className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--color-surface-subtle)]"
                    onClick={() => setExpandedViolation(expandedViolation === `${idx}` ? null : `${idx}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${SEVERITY_STYLES[violation.severity]}`}>
                        {violation.severity}
                      </span>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">{violation.ruleName}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          {CATEGORY_LABELS[violation.category] || violation.category} &bull; {violation.resourceName}
                        </p>
                      </div>
                    </div>
                    <span className="text-[var(--color-text-secondary)] text-lg">
                      {expandedViolation === `${idx}` ? '▲' : '▼'}
                    </span>
                  </div>
                  {expandedViolation === `${idx}` && (
                    <div className="px-4 pb-4 border-t border-[var(--color-border-primary)] pt-3 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Issue</p>
                        <p className="text-sm text-[var(--color-text-primary)] mt-1">{violation.description}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Remediation</p>
                        <p className="text-sm text-blue-800">{violation.remediation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-[var(--color-text-secondary)] text-center">
            Last checked: {new Date(report.checkedAt).toLocaleString()} &bull; Snapshot: {report.snapshotId.slice(0, 8)}...
          </p>
        </>
      )}
    </div>
  );
};
