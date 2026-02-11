import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface ScheduleConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  hour: number;
  dayOfWeek: number;
  retainCount: number;
}

interface SnapshotHistory {
  id: string;
  snapshot_type: string;
  size_bytes: number;
  created_at: string;
  notes?: string;
}

interface SchedulerPageProps {
  organizationId: string;
  organizationName?: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return { value: i, label: `${h}:00 ${ampm}` };
});

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export const SchedulerPage: React.FC<SchedulerPageProps> = ({ organizationId, organizationName }) => {
  const [schedule, setSchedule] = useState<ScheduleConfig | null>(null);
  const [history, setHistory] = useState<SnapshotHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [form, setForm] = useState<ScheduleConfig>({
    enabled: false,
    frequency: 'daily',
    hour: 2,
    dayOfWeek: 1,
    retainCount: 10,
  });

  useEffect(() => {
    loadSchedule();
  }, [organizationId]);

  const loadSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.getSchedule(organizationId);
      setHistory(data.history || []);
      if (data.schedule) {
        setSchedule(data.schedule);
        setForm(data.schedule);
      } else {
        setSchedule(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await apiClient.setSchedule(organizationId, form);
      setSchedule(result.schedule);
      setSuccess('Schedule saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const disableSchedule = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.deleteSchedule(organizationId);
      setSchedule(null);
      setForm(f => ({ ...f, enabled: false }));
      setSuccess('Schedule disabled');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to disable schedule');
    } finally {
      setSaving(false);
    }
  };

  const triggerNow = async () => {
    setTriggering(true);
    setError('');
    setSuccess('');
    try {
      const result = await apiClient.triggerScheduledSnapshot(organizationId);
      setSuccess(`Snapshot created (${result.snapshotId.slice(0, 8)}…)${result.pruned > 0 ? ` — ${result.pruned} old snapshot(s) pruned` : ''}`);
      setTimeout(() => setSuccess(''), 5000);
      await loadSchedule(); // Refresh history
    } catch (err: any) {
      setError(err.message || 'Failed to trigger snapshot');
    } finally {
      setTriggering(false);
    }
  };

  const frequencyLabel = (cfg: ScheduleConfig) => {
    if (!cfg.enabled) return 'Disabled';
    if (cfg.frequency === 'hourly') return 'Every hour';
    const timeLabel = HOURS.find(h => h.value === cfg.hour)?.label ?? `${cfg.hour}:00`;
    if (cfg.frequency === 'daily') return `Daily at ${timeLabel}`;
    return `Weekly on ${DAYS[cfg.dayOfWeek]} at ${timeLabel}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Scheduled Snapshots</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {organizationName ? `${organizationName} — ` : ''}Automatically capture configuration snapshots on a schedule.
          </p>
        </div>
        <button
          onClick={triggerNow}
          disabled={triggering}
          className="px-4 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm font-medium hover:bg-[var(--color-surface-subtle)] disabled:opacity-50"
        >
          {triggering ? 'Capturing...' : 'Capture Now'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">Loading schedule...</div>
      ) : (
        <>
          {/* Current status */}
          {schedule && (
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              schedule.enabled
                ? 'bg-green-50 border-green-200'
                : 'bg-[var(--color-surface-subtle)] border-[var(--color-border-primary)]'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{schedule.enabled ? '🟢' : '⚫'}</span>
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {schedule.enabled ? 'Scheduling Active' : 'Scheduling Disabled'}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{frequencyLabel(schedule)}</p>
                </div>
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                Keeping {schedule.retainCount} snapshots
              </div>
            </div>
          )}

          {/* Schedule Form */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6 space-y-5">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Configure Schedule</h3>

            {/* Enable toggle */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {form.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={e => setForm(f => ({ ...f, frequency: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {/* Hour (for daily/weekly) */}
              {(form.frequency === 'daily' || form.frequency === 'weekly') && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Time of Day</label>
                  <select
                    value={form.hour}
                    onChange={e => setForm(f => ({ ...f, hour: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    {HOURS.map(h => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Day of week (for weekly) */}
              {form.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Day of Week</label>
                  <select
                    value={form.dayOfWeek}
                    onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    {DAYS.map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Retain count */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Keep last N snapshots
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.retainCount}
                  onChange={e => setForm(f => ({ ...f, retainCount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={saveSchedule}
                disabled={saving}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Schedule'}
              </button>
              {schedule && schedule.enabled && (
                <button
                  onClick={disableSchedule}
                  disabled={saving}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                >
                  Disable
                </button>
              )}
            </div>
          </div>

          {/* Snapshot History */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border-primary)]">
              <h3 className="font-semibold text-[var(--color-text-primary)]">Scheduled Snapshot History</h3>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-10 text-[var(--color-text-secondary)] text-sm">
                No scheduled snapshots yet. Use Capture Now or configure a schedule.
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border-primary)]">
                {history.map(snap => (
                  <div key={snap.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {new Date(snap.created_at).toLocaleString()}
                      </p>
                      {snap.notes && (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{snap.notes}</p>
                      )}
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {formatBytes(snap.size_bytes || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
