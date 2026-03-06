import React, { useState, useEffect } from "react";

import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import LogsCard from "../LogsCard";
import StepHeadingCard from "../StepHeadingCard";

import {
  createSelectiveBackup,
  createExhaustiveBackup,
} from "../../../services/merakiService";
import { formatLogDuration } from "@/src/utilities/formatLogDuration";
import ProcedureCard from "../ProcedureCard";

interface BackupExecutionStepProps {
  data: any;
  onComplete: () => void;
  onUpdate: (data: any) => void;
  backupType: any;
  setLogDuration: any;
}

export function BackupExecutionStep({
  data,
  onComplete,
  onUpdate,
  backupType,
  setLogDuration,
}: BackupExecutionStepProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const logCallback = (msg: string) => {
    setLogs((prevLogs) => [
      ...prevLogs,
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  };

  const startBackup = async (type: "selective" | "full") => {
    setIsBackingUp(true);
    setIsComplete(false);
    setError(null);
    setLogs([]);

    const startTime = Date.now(); // ⬅️ START TIMER

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
        logCallback(
          `Starting FULL backup for organization "${data.organization.name}"...`,
        );

        blob = await createExhaustiveBackup(
          data.apiKey,
          data.region || "com",
          data.organization.id,
          logCallback,
        );

        filename = `meraki-full-backup-${safeOrgName}-${Date.now()}.zip`;
      }

      const endTime = Date.now(); // ⬅️ END TIMER
      const durationMs = endTime - startTime;

      const formattedDuration = formatLogDuration(durationMs);

      // 🔥 send to parent
      setLogDuration(durationMs);

      logCallback(`--- ⏱ Backup completed in ${formattedDuration} ---`);

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
    <div className="step-card-inner-layout">
      <ProcedureCard
        icon={
          isBackingUp ? (
            <Loader2 size={30} className="animate-spin text-[#049FD9]" />
          ) : isComplete ? (
            <CheckCircle2 size={30} className="text-green-500" />
          ) : (
            error && <XCircle size={30} className="text-red-500" />
          )
        }
        heading={
          isBackingUp
            ? "Executing Backup"
            : isComplete
              ? "Backup Complete"
              : error && "Backup Failed"
        }
      />
      {/* Logs */}
      <LogsCard logName="Live Backup Log">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap leading-relaxed">
              {log}
            </div>
          ))
        ) : (
          <div className="text-gray-400">Starting backup...</div>
        )}
        {error && (
          <div className="text-red-600 mt-2 font-semibold">{error}</div>
        )}
      </LogsCard>
    </div>
  );
}
