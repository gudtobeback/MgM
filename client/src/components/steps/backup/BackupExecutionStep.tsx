import React, { useState } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import {
  Loader2,
  CheckCircle2,
  PlayCircle,
  Archive,
  ListChecks,
} from "lucide-react";
// FIX: Use correct relative path for merakiService import.
import {
  createSelectiveBackup,
  createExhaustiveBackup,
} from "../../../services/merakiService";

interface BackupExecutionStepProps {
  data: any;
  onComplete: () => void;
  onUpdate: (data: any) => void;
}

export function BackupExecutionStep({
  data,
  onComplete,
  onUpdate,
}: BackupExecutionStepProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [backupType, setBackupType] = useState<"selective" | "full" | null>(
    null,
  );

  const startBackup = async (type: "selective" | "full") => {
    setIsBackingUp(true);
    setIsComplete(false);
    setError(null);
    setLogs([]);
    setBackupType(type);

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

  const isDataReady = !!data.apiKey && !!data.organization?.id;

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
        {!backupType ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selective Backup Card */}
            <Card className="p-6 flex flex-col">
              <div className="flex items-center gap-3">
                <ListChecks className="w-8 h-8 text-purple-600" />
                <h3 className="text-lg font-semibold">
                  Selective Device Backup
                </h3>
              </div>
              <p className="text-muted-foreground mt-2 flex-grow">
                Create a lightweight JSON backup containing only the{" "}
                <strong>{data.selectedDevices.length} devices</strong> you chose
                in the previous step. Good for targeted restores.
              </p>
              <Button
                onClick={() => startBackup("selective")}
                disabled={
                  !isDataReady ||
                  data.selectedDevices.length === 0 ||
                  isBackingUp
                }
                className="w-full mt-4"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Backup {data.selectedDevices.length} Selected Devices
              </Button>
            </Card>

            {/* Full Backup Card */}
            <Card className="p-6 flex flex-col">
              <div className="flex items-center gap-3">
                <Archive className="w-8 h-8 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  Full Organization Backup
                </h3>
              </div>
              <p className="text-muted-foreground mt-2 flex-grow">
                {/* FIX: Changed UI text from JSON backup to ZIP archive for clarity. */}
                Create a comprehensive ZIP archive of{" "}
                <strong>all configurations</strong> for all devices, networks,
                and the entire organization. This is the most complete backup
                but may take several minutes.
              </p>
              <Button
                onClick={() => startBackup("full")}
                disabled={!isDataReady || isBackingUp}
                className="w-full mt-4"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Start Full Backup
              </Button>
            </Card>
          </div>
        ) : (
          // Logs
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
        )}
      </div>
    </div>
  );
}
