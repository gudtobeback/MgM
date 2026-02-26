import React, { useState, useEffect } from "react";

import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import {
  createExhaustiveBackup,
  createSelectiveBackup,
} from "../../../services/merakiService";

interface BackupStepProps {
  data: any;
  onComplete: () => void;
  onUpdate: (data: any) => void;
}

export function BackupStep({ data, onComplete, onUpdate }: BackupStepProps) {
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

  useEffect(() => {
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

    startBackup();
  }, []); // Run only once on mount

  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[16px]">
            {isComplete
              ? "Backup Phase Complete"
              : "Creating Pre-Migration Backup"}
          </p>
          {isComplete && !error && (
            <CheckCircle2 size={24} className="text-green-500" />
          )}
          {isComplete && error && (
            <XCircle size={24} className="text-red-500" />
          )}
          {isBackingUp && (
            <Loader2 size={24} className="animate-spin text-[#2563eb]" />
          )}
        </div>
        <p className="text-[12px] text-[#232C32]">
          Performing a full, exhaustive backup of the source organization. This
          is a critical safety step.
        </p>
      </div>

      {/* Logs */}
      <div className="flex flex-col gap-3 p-6">
        <p className="text-sm text-[#333232]">Live Backup Log</p>

        <div className="h-80 p-4 font-mono text-sm text-[#D5D5D5] bg-black border border-[#B3B3B3] rounded-md overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap leading-relaxed">
              {log}
            </div>
          ))}
          {error && (
            <div className="text-red-600 mt-2 font-semibold">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
