import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/apiClient';
import { formatDistance } from 'date-fns';
import {
  Camera, GitBranch, Clock, HardDrive, CheckCircle2, AlertCircle,
  Loader2, Shield, User, CalendarClock, ArrowRightLeft, ChevronDown, ChevronUp,
  Terminal, X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Snapshot {
  id: string;
  organizationId: string;
  snapshotType: 'manual' | 'scheduled' | 'pre-change' | 'post-change';
  snapshotData: any;
  snapshotMetadata?: any;
  sizeBytes: number;
  createdBy?: string;
  createdAt: string;
  notes?: string;
}

interface LogLine {
  step: string;
  detail: string;
  status: 'running' | 'done' | 'error';
  ts: number;
}

interface SnapshotTimelineProps {
  organizationId: string;
  onCompare?: (snapshot1Id: string, snapshot2Id: string) => void;
  onView?: (snapshot: Snapshot) => void;
}

const TYPE_META: Record<string, { label: string; from: string; to: string; Icon: React.ElementType }> = {
  manual:       { label: 'Manual',      from: '#3b82f6', to: '#4f46e5', Icon: User },
  scheduled:    { label: 'Scheduled',   from: '#10b981', to: '#059669', Icon: CalendarClock },
  'pre-change': { label: 'Pre-Change',  from: '#f59e0b', to: '#d97706', Icon: Shield },
  'post-change':{ label: 'Post-Change', from: '#8b5cf6', to: '#7c3aed', Icon: CheckCircle2 },
};

function formatBytes(bytes: number) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ── Live Log Panel ─────────────────────────────────────────────────────────────

const LiveLog: React.FC<{ lines: LogLine[]; done: boolean; error: string; onClose: () => void }> = ({
  lines, done, error, onClose,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/40"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(79,70,229,0.12))' }}>
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-blue-500" />
          <span className="text-sm font-semibold text-foreground">Snapshot Progress</span>
          {!done && !error && <Loader2 size={13} className="animate-spin text-blue-500 ml-1" />}
        </div>
        <div className="flex items-center gap-3">
          {done && !error && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
              <CheckCircle2 size={12} /> Complete
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
              <AlertCircle size={12} /> Failed
            </span>
          )}
          {(done || !!error) && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Terminal body */}
      <div className="bg-gray-950/90 backdrop-blur-sm px-4 py-3 font-mono text-xs max-h-72 overflow-y-auto space-y-0.5">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-2.5 py-0.5">
            <span className="shrink-0 mt-0.5">
              {line.status === 'running' && <Loader2 size={11} className="animate-spin text-blue-400" />}
              {line.status === 'done'    && <CheckCircle2 size={11} className="text-green-400" />}
              {line.status === 'error'   && <AlertCircle size={11} className="text-red-400" />}
            </span>
            <span className="text-gray-500 shrink-0 w-14 text-right select-none">
              +{lines[0] ? ((line.ts - lines[0].ts) / 1000).toFixed(1) : '0.0'}s
            </span>
            <span className={cn(
              'break-all',
              line.status === 'running' && 'text-blue-300',
              line.status === 'done'    && 'text-green-300',
              line.status === 'error'   && 'text-red-400',
            )}>
              {line.detail}
            </span>
          </div>
        ))}
        {error && (
          <div className="flex items-start gap-2.5 py-0.5 mt-1">
            <AlertCircle size={11} className="text-red-400 shrink-0 mt-0.5" />
            <span className="text-red-400 break-all">{error}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────

export const SnapshotTimeline: React.FC<SnapshotTimelineProps> = ({
  organizationId, onCompare, onView,
}) => {
  const [snapshots,   setSnapshots]   = useState<Snapshot[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [creating,    setCreating]    = useState(false);
  const [logLines,    setLogLines]    = useState<LogLine[]>([]);
  const [logDone,     setLogDone]     = useState(false);
  const [logError,    setLogError]    = useState('');
  const [showLog,     setShowLog]     = useState(false);
  const [error,       setError]       = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingId,   setViewingId]   = useState<string | null>(null);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);

  useEffect(() => { loadSnapshots(); }, [organizationId]);

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      const data = await apiClient.listSnapshots(organizationId, { limit: 50 });
      setSnapshots(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setCreating(true);
    setLogLines([]);
    setLogDone(false);
    setLogError('');
    setShowLog(true);
    setError('');

    const token = localStorage.getItem('accessToken');
    // Derive base URL from the apiClient or fall back to empty string (same origin)
    const baseUrl = (apiClient as any).baseUrl ?? '';
    const url = `${baseUrl}/api/organizations/${organizationId}/snapshots/stream?type=manual&notes=${encodeURIComponent('Manual snapshot')}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newline
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const dataLine = part.replace(/^data:\s*/m, '').trim();
          if (!dataLine) continue;
          try {
            const evt = JSON.parse(dataLine);
            if (evt.step === 'result') {
              if (evt.status === 'done') {
                setSnapshots(prev => [evt.snapshot, ...prev]);
                setLogDone(true);
              } else {
                setLogError(evt.error || 'Unknown error');
                setLogDone(true);
              }
            } else {
              const newLine: LogLine = { ...evt, ts: Date.now() };
              setLogLines(prev => {
                // Replace a 'running' line for the same step with updated status
                const idx = prev.map(l => l.step).lastIndexOf(evt.step);
                if (idx >= 0 && prev[idx].status === 'running') {
                  const next = [...prev];
                  next[idx] = newLine;
                  return next;
                }
                return [...prev, newLine];
              });
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create snapshot';
      setLogError(msg);
      setError(msg);
      setLogDone(true);
    } finally {
      setCreating(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  const handleView = async (snapshotId: string) => {
    if (!onView) return;
    setViewingId(snapshotId);
    try {
      const full = await apiClient.getSnapshot(organizationId, snapshotId);
      onView(full);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load snapshot');
    } finally {
      setViewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-pulse">
        <Loader2 size={40} className="text-blue-500 opacity-50 animate-spin mb-4" />
        <p className="text-sm">Loading snapshots…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <GitBranch size={20} className="text-amber-500" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Configuration Snapshots</h1>
          </div>
          <p className="text-sm text-muted-foreground">Version control for your Meraki configuration.</p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length === 2 && (
            <button
              onClick={() => onCompare?.(selectedIds[0], selectedIds[1])}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-foreground border border-white/40 bg-white/40 hover:bg-white/60 transition-all backdrop-blur-sm"
            >
              <ArrowRightLeft size={14} />
              Compare
            </button>
          )}
          <button
            onClick={handleCreateSnapshot}
            disabled={creating}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {creating ? 'Capturing…' : '+ Create Snapshot'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-red-50/80 border border-red-200/80 text-red-700 text-sm backdrop-blur-sm">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {/* Selection banner */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 text-blue-700 text-sm backdrop-blur-sm">
          <CheckCircle2 size={14} className="shrink-0" />
          {selectedIds.length === 1 ? 'Select one more snapshot to compare' : '2 snapshots selected — click Compare'}
          <button onClick={() => setSelectedIds([])} className="ml-auto text-xs text-blue-500 hover:text-blue-700 underline">
            Clear
          </button>
        </div>
      )}

      {/* Live log */}
      {showLog && (
        <LiveLog lines={logLines} done={logDone} error={logError} onClose={() => setShowLog(false)} />
      )}

      {/* Empty state */}
      {snapshots.length === 0 && !showLog && (
        <div className="text-center py-20 border border-dashed border-white/50 rounded-xl bg-white/10 backdrop-blur-sm">
          <div className="flex justify-center mb-3 text-muted-foreground opacity-30">
            <Camera size={52} />
          </div>
          <h2 className="font-semibold text-foreground text-lg">No Snapshots Yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Create your first snapshot to start tracking configuration changes.
          </p>
          <button
            onClick={handleCreateSnapshot}
            disabled={creating}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}
          >
            <Camera size={14} />
            Create First Snapshot
          </button>
        </div>
      )}

      {/* Timeline */}
      {snapshots.length > 0 && (
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-px bg-white/40 rounded-full" />

          <div className="space-y-3">
            {snapshots.map((snap, index) => {
              const meta       = TYPE_META[snap.snapshotType] ?? TYPE_META.manual;
              const Icon       = meta.Icon;
              const isSelected = selectedIds.includes(snap.id);
              const isExpanded = expandedId === snap.id;

              return (
                <div key={snap.id} className="relative pl-12">
                  {/* Dot */}
                  <div
                    className="absolute left-2.5 top-5 w-[14px] h-[14px] rounded-full border-2 border-white/80 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}
                  />

                  {/* Card */}
                  <div className={cn(
                    'glass-card transition-all duration-200',
                    isSelected && 'ring-2 ring-blue-400'
                  )}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">

                        {/* Left */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                            style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}
                          >
                            <Icon size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground text-sm">
                                Snapshot #{snapshots.length - index}
                              </span>
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                                style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}
                              >
                                {meta.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {formatDistance(new Date(snap.createdAt), new Date(), { addSuffix: true })}
                              </span>
                              <span className="flex items-center gap-1">
                                <HardDrive size={10} />
                                {formatBytes(snap.sizeBytes)}
                              </span>
                            </div>
                            {snap.notes && (
                              <p className="text-xs text-muted-foreground mt-1.5 truncate">{snap.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* Right actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(snap.id)}
                            className="w-4 h-4 rounded border-white/40 bg-white/50 cursor-pointer accent-blue-600"
                            title="Select for comparison"
                          />
                          <button
                            onClick={() => handleView(snap.id)}
                            disabled={viewingId === snap.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground border border-white/40 bg-white/40 hover:bg-white/60 transition-all disabled:opacity-50"
                          >
                            {viewingId === snap.id
                              ? <Loader2 size={11} className="animate-spin" />
                              : 'View'}
                          </button>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : snap.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/40 transition-all"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded metadata */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-white/40 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                          <div>
                            <p className="font-semibold uppercase tracking-wide text-[10px] mb-0.5">Snapshot ID</p>
                            <p className="font-mono truncate">{snap.id.slice(0, 16)}…</p>
                          </div>
                          <div>
                            <p className="font-semibold uppercase tracking-wide text-[10px] mb-0.5">Created</p>
                            <p>{new Date(snap.createdAt).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="font-semibold uppercase tracking-wide text-[10px] mb-0.5">Size</p>
                            <p>{formatBytes(snap.sizeBytes)}</p>
                          </div>
                          {snap.createdBy && (
                            <div>
                              <p className="font-semibold uppercase tracking-wide text-[10px] mb-0.5">Created By</p>
                              <p>{snap.createdBy}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
