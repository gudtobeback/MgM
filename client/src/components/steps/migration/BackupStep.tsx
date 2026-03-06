import React, { useState, useEffect } from "react";

import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import LogsCard from "../LogsCard";
import ProcedureCard from "../ProcedureCard";

import {
  createExhaustiveBackup,
  createSelectiveBackup,
} from "../../../services/merakiService";

interface BackupStepProps {
  data: any;
  onComplete: () => void;
  onUpdate: (data: any) => void;
  setLogStartTime: any;
}

export function BackupStep({
  data,
  onComplete,
  onUpdate,
  setLogStartTime,
}: BackupStepProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const log = (msg: string) => {
    setLogs((prevLogs) => [
      ...prevLogs,
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  };

  const startBackup = async () => {
    if (
      !data.sourceApiKey ||
      !data.sourceOrg ||
      data.devicesToMigrate.length === 0
    ) {
      log("❌ Prerequisite data missing. Cannot start backup.");
      setError(
        "Could not start backup due to missing data. Please restart the wizard.",
      );
      return;
    }

    setIsBackingUp(true);

    setLogStartTime(Date.now()); // ⬅️ START TIMER

    try {
      const safeOrgName = data.sourceOrg.name
        .replace(/\s+/g, "-")
        .toLowerCase();

      // --- Full Backup for Download ---
      log(
        `Starting FULL organization backup for "${data.sourceOrg.name}"... (This may take several minutes)`,
      );
      const fullBackupBlob = await createExhaustiveBackup(
        data.sourceApiKey,
        data.sourceRegion,
        data.sourceOrg.id,
        log,
      );
      // FIX: The exhaustive backup creates a ZIP file, so the extension has been corrected.
      const fullBackupFilename = `meraki-full-backup-${safeOrgName}-${Date.now()}.zip`;
      onUpdate({
        backupBlob: fullBackupBlob,
        backupFilename: fullBackupFilename,
      });
      // FIX: Updated log message to reflect that a ZIP file is created.
      log("--- ✅ Full backup ZIP file created successfully. ---");

      // --- Selective Backup for Restore ---
      log(
        "\nCreating in-memory configuration snapshot for automated restore...",
      );
      // Create a minimal log callback for the selective backup to avoid confusing logs.
      const selectiveLog = (msg: string) =>
        console.log(`[Selective Backup Internal]: ${msg}`);
      const selectiveBlob = await createSelectiveBackup(
        data.sourceApiKey,
        data.sourceRegion,
        data.sourceOrg,
        data.devicesToMigrate,
        selectiveLog,
      );
      const restoreJsonText = await selectiveBlob.text();
      const restoreData = JSON.parse(restoreJsonText);
      onUpdate({ restoreData: restoreData });
      log("--- ✅ In-memory snapshot for restore created. ---");

      setIsComplete(true);
      log("\nBackup phase complete! Proceeding to migration...");
      setTimeout(() => onComplete(), 2000);
    } catch (err: any) {
      const errorMessage =
        "A critical error occurred during backup: " +
        (err.message || "Unknown error");
      setError(errorMessage);
      log(`--- ❌ ${errorMessage} ---`);
      console.error("Backup error:", err);
    } finally {
      setIsBackingUp(false);
    }
  };

  useEffect(() => {
    startBackup();
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
            ? "Creating Pre-Migration Backup"
            : isComplete
              ? "Backup Phase Complete"
              : error && "Pre-Migration Backup Failed"
        }
      />

      {/* Logs */}
      <LogsCard logName="Live Backup Log">
        {logs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap leading-relaxed">
            {log}
          </div>
        ))}
        {error && (
          <div className="text-red-600 mt-2 font-semibold">{error}</div>
        )}
      </LogsCard>
    </div>
  );
}
