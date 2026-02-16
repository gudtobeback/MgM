import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Camera, CalendarClock, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

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

const DAYS  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h    = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return { value: i, label: `${h}:00 ${ampm}` };
});

function formatBytes(b: number) {
  if (b < 1024)            return `${b} B`;
  if (b < 1024 * 1024)     return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export const SchedulerPage: React.FC<SchedulerPageProps> = ({ organizationId, organizationName }) => {
  const [schedule,   setSchedule]   = useState<ScheduleConfig | null>(null);
  const [history,    setHistory]    = useState<SnapshotHistory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  const [form, setForm] = useState<ScheduleConfig>({
    enabled:    false,
    frequency:  'daily',
    hour:       2,
    dayOfWeek:  1,
    retainCount: 10,
  });

  useEffect(() => { loadSchedule(); }, [organizationId]);

  const loadSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.getSchedule(organizationId);
      setHistory(data.history || []);
      if (data.schedule) { setSchedule(data.schedule); setForm(data.schedule); }
      else setSchedule(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const result = await apiClient.setSchedule(organizationId, form);
      setSchedule(result.schedule);
      setSuccess('Schedule saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally { setSaving(false); }
  };

  const disableSchedule = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await apiClient.deleteSchedule(organizationId);
      setSchedule(null);
      setForm(f => ({ ...f, enabled: false }));
      setSuccess('Schedule disabled');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to disable schedule');
    } finally { setSaving(false); }
  };

  const triggerNow = async () => {
    setTriggering(true); setError(''); setSuccess('');
    try {
      const result = await apiClient.triggerScheduledSnapshot(organizationId);
      setSuccess(`Snapshot created (${result.snapshotId.slice(0, 8)}…)${result.pruned > 0 ? ` — ${result.pruned} old pruned` : ''}`);
      setTimeout(() => setSuccess(''), 5000);
      await loadSchedule();
    } catch (err: any) {
      setError(err.message || 'Failed to trigger snapshot');
    } finally { setTriggering(false); }
  };

  const frequencyLabel = (cfg: ScheduleConfig) => {
    if (!cfg.enabled) return 'Disabled';
    if (cfg.frequency === 'hourly') return 'Every hour';
    const timeLabel = HOURS.find(h => h.value === cfg.hour)?.label ?? `${cfg.hour}:00`;
    if (cfg.frequency === 'daily') return `Daily at ${timeLabel}`;
    return `Weekly on ${DAYS[cfg.dayOfWeek]} at ${timeLabel}`;
  };

  const selectClass = "w-full px-3 py-2 text-sm rounded-md border border-[var(--color-border-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-shadow";

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Scheduled Snapshots
            </h2>
            {organizationName && (
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-medium">
                {organizationName}
              </Badge>
            )}
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Automatically capture configuration snapshots on a recurring schedule.
          </p>
        </div>
        <Button
          onClick={triggerNow}
          disabled={triggering}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          <Camera size={14} />
          {triggering ? 'Capturing…' : 'Capture Now'}
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle2 size={15} className="shrink-0" />
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Loading schedule…
        </div>
      ) : (
        <>
          {/* Status card */}
          {schedule && (
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              schedule.enabled
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${schedule.enabled ? 'bg-blue-500' : 'bg-gray-400'}`} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {schedule.enabled ? 'Scheduling Active' : 'Scheduling Disabled'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {frequencyLabel(schedule)}
                  </p>
                </div>
              </div>
              <Badge variant={schedule.enabled ? 'default' : 'secondary'} className="text-xs">
                {schedule.retainCount} snapshots kept
              </Badge>
            </div>
          )}

          {/* Configure form */}
          <div className="rounded-xl border p-6 space-y-6"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-primary)' }}>

            <div className="flex items-center gap-2">
              <CalendarClock size={16} style={{ color: 'var(--color-primary)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Configure Schedule
              </h3>
            </div>

            {/* Enable toggle */}
            <div className="flex items-center gap-3">
              <Switch
                id="sched-enabled"
                checked={form.enabled}
                onCheckedChange={v => setForm(f => ({ ...f, enabled: v }))}
              />
              <Label htmlFor="sched-enabled" className="text-sm font-medium cursor-pointer"
                style={{ color: 'var(--color-text-primary)' }}>
                {form.enabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Frequency */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  Frequency
                </Label>
                <select
                  value={form.frequency}
                  onChange={e => setForm(f => ({ ...f, frequency: e.target.value as any }))}
                  className={selectClass}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {/* Time of day */}
              {(form.frequency === 'daily' || form.frequency === 'weekly') && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-secondary)' }}>
                    Time of Day
                  </Label>
                  <select
                    value={form.hour}
                    onChange={e => setForm(f => ({ ...f, hour: Number(e.target.value) }))}
                    className={selectClass}
                  >
                    {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              )}

              {/* Day of week */}
              {form.frequency === 'weekly' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-secondary)' }}>
                    Day of Week
                  </Label>
                  <select
                    value={form.dayOfWeek}
                    onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                    className={selectClass}
                  >
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              )}

              {/* Retain count */}
              <div className="space-y-1.5">
                <Label htmlFor="retain-count" className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  Keep Last N Snapshots
                </Label>
                <Input
                  id="retain-count"
                  type="number"
                  min={1}
                  max={100}
                  value={form.retainCount}
                  onChange={e => setForm(f => ({ ...f, retainCount: Number(e.target.value) }))}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1 border-t"
              style={{ borderColor: 'var(--color-border-subtle)' }}>
              <Button onClick={saveSchedule} disabled={saving} size="sm">
                {saving ? 'Saving…' : 'Save Schedule'}
              </Button>
              {schedule?.enabled && (
                <Button
                  onClick={disableSchedule}
                  disabled={saving}
                  variant="destructive"
                  size="sm"
                >
                  Disable
                </Button>
              )}
            </div>
          </div>

          {/* Snapshot history */}
          <div className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-primary)' }}>
            <div className="flex items-center gap-2 px-5 py-3.5 border-b"
              style={{ borderColor: 'var(--color-border-primary)' }}>
              <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Snapshot History
              </h3>
              {history.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">{history.length}</Badge>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No scheduled snapshots yet. Use <strong>Capture Now</strong> or configure a schedule above.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
                {history.map(snap => (
                  <div key={snap.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {new Date(snap.created_at).toLocaleString()}
                      </p>
                      {snap.notes && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                          {snap.notes}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {formatBytes(snap.size_bytes || 0)}
                    </Badge>
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
