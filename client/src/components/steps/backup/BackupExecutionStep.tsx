import React, { useState, useEffect } from "react";

import { Loader2, CheckCircle2 } from "lucide-react";

import {
  createSelectiveBackup,
  createExhaustiveBackup,
} from "../../../services/merakiService";

interface BackupExecutionStepProps {
  data: any;
  onComplete: () => void;
  onUpdate: (data: any) => void;
  backupType: any;
}

export function BackupExecutionStep({
  data,
  onComplete,
  onUpdate,
  backupType,
}: BackupExecutionStepProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const startBackup = async (type: "selective" | "full") => {
    setIsBackingUp(true);
    setIsComplete(false);
    setError(null);
    setLogs([]);

    const logCallback = (msg: string) => {
      setLogs((prevLogs) => [
        ...prevLogs,
        `[${new Date().toLocaleTimeString()}] ${msg}`,
      ]);
    };

    try {
      let blob: Blob;
      let filename: string;
      const safeOrgName = data.organization.name
        .replace(/\s+/g, "-")
        .toLowerCase();

      if (type === "selective") {
        logCallback(
          `Starting SELECTIVE backup for ${data.selectedDevices.length} devices...`,
        );
        blob = await createSelectiveBackup(
          data.apiKey,
          data.region || "com",
          data.organization,
          data.selectedDevices,
          logCallback,
        );
        filename = `meraki-selective-backup-${safeOrgName}-${Date.now()}.json`;
      } else {
        // full backup
        logCallback(
          `Starting FULL backup for organization "${data.organization.name}"...`,
        );
        blob = await createExhaustiveBackup(
          data.apiKey,
          data.region || "com",
          data.organization.id,
          logCallback,
        );
        // FIX: Corrected filename to use .zip for exhaustive backups, which create a ZIP archive.
        filename = `meraki-full-backup-${safeOrgName}-${Date.now()}.zip`;
      }

      onUpdate({ backupBlob: blob, backupFilename: filename });
      setIsComplete(true);
      logCallback("--- ✅ Backup completed successfully! ---");
      setTimeout(() => onComplete(), 1500);
    } catch (err: any) {
      const errorMessage = "Backup failed: " + (err.message || "Unknown error");
      setError(errorMessage);
      logCallback(`--- ❌ ${errorMessage} ---`);
      console.error("Backup error:", err);
    } finally {
      setIsBackingUp(false);
    }
  };

  useEffect(() => {
    if (backupType) startBackup(backupType);
  }, []);

  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="font-semibold text-[16px]">Execute Backup</p>
        <p className="text-[12px] text-[#232C32]">
          Choose the type of backup you want to perform for "
          {data.organization?.name}".
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Logs */}
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-3 text-sm text-[#333232]">
            {isComplete
              ? "Backup Complete"
              : isBackingUp
                ? "Live Backup Log"
                : "Backup Log"}

            {isComplete && (
              <CheckCircle2 size={24} className="text-green-500" />
            )}
            {isBackingUp && (
              <Loader2 size={24} className="animate-spin text-purple-600" />
            )}
          </p>

          <div className="h-80 p-4 font-mono text-sm text-[#D5D5D5] bg-black border border-[#B3B3B3] rounded-md overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="whitespace-pre-wrap leading-relaxed"
                >
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-400">Starting backup...</div>
            )}
            {error && (
              <div className="text-red-600 mt-2 font-semibold">{error}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
