import React, { useState } from 'react';
import { SnapshotTimeline } from './SnapshotTimeline';
import { SnapshotDiffViewer } from './SnapshotDiffViewer';
import { SnapshotDetailViewer } from './SnapshotDetailViewer';

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

interface VersionControlPageProps {
  organizationId: string;
}

export const VersionControlPage: React.FC<VersionControlPageProps> = ({ organizationId }) => {
  const [compareMode, setCompareMode] = useState<{ snapshot1: string; snapshot2: string } | null>(null);
  const [viewedSnapshot, setViewedSnapshot] = useState<Snapshot | null>(null);

  const handleCompare = (snapshot1Id: string, snapshot2Id: string) => {
    setCompareMode({ snapshot1: snapshot1Id, snapshot2: snapshot2Id });
  };

  const handleCloseDiff = () => {
    setCompareMode(null);
  };

  const handleView = (snapshot: Snapshot) => {
    setViewedSnapshot(snapshot);
  };

  const handleCloseView = () => {
    setViewedSnapshot(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <SnapshotTimeline
          organizationId={organizationId}
          onCompare={handleCompare}
          onView={handleView}
        />
      </div>

      {viewedSnapshot && (
        <SnapshotDetailViewer
          snapshot={viewedSnapshot}
          onClose={handleCloseView}
        />
      )}

      {compareMode && (
        <SnapshotDiffViewer
          organizationId={organizationId}
          snapshot1Id={compareMode.snapshot1}
          snapshot2Id={compareMode.snapshot2}
          onClose={handleCloseDiff}
        />
      )}
    </div>
  );
};
