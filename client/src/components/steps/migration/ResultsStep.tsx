import {
  CheckCircle2,
  Download,
  FileArchive,
  RefreshCw,
  XCircle,
  ShieldCheck,
  HardDriveUpload,
  DatabaseZap,
  CircleAlert,
  FolderClosed,
} from "lucide-react";

import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import AlertCard from "../../ui/AlertCard";
import CustomButton from "../../ui/CustomButton";
import OvalButton from "../../home/OvalButton";

import { MigrationData } from "../../../types/types";
import { formatLogDuration } from "@/src/utilities/formatLogDuration";

interface ResultsStepProps {
  data: MigrationData;
  onReset: () => void;
  logDuration: any;
}

export function ResultsStep({ data, onReset, logDuration }: ResultsStepProps) {
  const {
    sourceOrg,
    destinationOrg,
    destinationNetwork,
    backupBlob,
    backupFilename,
    migrationSuccess,
    migrationErrors,
    restoreDeviceSuccessCount,
    restoreNetworkSuccessCount,
  } = data;

  const timestamp = new Date().toLocaleString();
  const fileSize = backupBlob
    ? (backupBlob.size / 1024 / 1024).toFixed(2)
    : "0.00";
  const filename = backupFilename || `meraki-backup.zip`;

  const handleDownload = () => {
    if (!backupBlob) return;
    const url = URL.createObjectURL(backupBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasMigrationErrors = migrationErrors.length > 0;

  // Calculated Backup Time
  const formattedDuration = formatLogDuration(logDuration);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 py-6">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 ${hasMigrationErrors ? "bg-orange-100" : "bg-green-100"}`}
        >
          <CheckCircle2
            size={40}
            className={`${hasMigrationErrors ? "text-orange-600" : "text-green-600"}`}
          />
        </div>
        <p className="text-2xl font-bold">Migration Process Complete</p>
        <p className="text-green-600">
          Migration completed in <strong>{formattedDuration}...</strong>
        </p>
        <p className="text-muted-foreground">
          {hasMigrationErrors
            ? "Migration completed with some errors."
            : `Successfully migrated devices from ${sourceOrg?.name} to ${destinationOrg?.name}.`}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 w-full">
        <div className="col-span-1 flex flex-col items-center justify-between gap-3 p-6 rounded-lg border border-[#87D2ED] w-full">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} />
            Backup
          </div>

          <p className="text-2xl font-bold">Complete</p>
        </div>

        <div className="col-span-1 flex flex-col items-center justify-between gap-3 p-6 rounded-lg border border-[#87D2ED] w-full">
          <div className="flex items-center gap-2">
            <HardDriveUpload size={20} />
            Migration
          </div>

          <p className="text-2xl font-bold">
            {migrationSuccess.length}{" "}
            <span className="text-lg text-muted-foreground">Moved</span>
          </p>
          {migrationErrors.length > 0 && (
            <p className="text-red-500">{migrationErrors.length} Failed</p>
          )}
        </div>

        <div className="col-span-1 flex flex-col items-center justify-between gap-3 p-6 rounded-lg border border-[#87D2ED] w-full">
          <div className="flex items-center gap-2">
            <DatabaseZap size={20} />
            Restore
          </div>

          <p className="text-sm">
            {restoreDeviceSuccessCount} Device configs restored
          </p>
          <p className="text-sm">
            {restoreNetworkSuccessCount} Network configs restored
          </p>
        </div>
      </div>

      {/* Download Full backup */}
      <div className="p-6 flex flex-col gap-5 bg-white border border-[#C1C7D11A] rounded-lg shadow-[0_0_1px_0_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-3 text-[#003E68]">
          <FolderClosed className="" />
          <p className="font-semibold">Backup File Information</p>
        </div>

        <div className="p-4 flex items-center gap-4 bg-[#F3F4F5] rounded-md">
          <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <FileArchive size={24} className="text-[#003E68]" />
          </div>

          <div className="flex-1 space-y-1">
            <p className="font-semibold text-sm text-[#0F172A]">{filename}</p>
            <p className="text-sm text-[#64748B]">
              Size: {fileSize} MB | Created: {timestamp}
            </p>
          </div>

          <OvalButton
            onClick={handleDownload}
            text_prop="text-white"
            bg_prop="bg-[#003E68]"
            disabled={!backupBlob}
          >
            <Download size={16} />
            Download Full Backup
          </OvalButton>
        </div>
      </div>

      {migrationErrors.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-red-600">Migration Errors</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {migrationErrors.map(({ device, error }, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p>
                      {device.name} ({device.serial})
                    </p>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
                <Badge variant="destructive">Failed</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Note */}
      <div className="p-4 flex gap-3 bg-[#D0E4FF4D] border-l-4 border-[#003E68]">
        <CircleAlert size={18} className="mt-0.5 text-[#004A7A]" />

        <div className="space-y-1 text-sm">
          <div className="font-semibold text-[#004A7A]">Next Steps:</div>
          <div className="text-[#004A7A]">
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Verify the migrated devices in the{" "}
                <a
                  href={`https://dashboard.meraki.in/o/${destinationOrg?.id}/n/${destinationNetwork?.id}/manage/nodes/list`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  destination dashboard
                </a>
                .
              </li>
              <li>
                The full backup file can be used for a manual restore if needed.
              </li>
            </ol>
          </div>
        </div>
      </div>

      <OvalButton
        onClick={onReset}
        text_prop="text-white"
        bg_prop="bg-[#003E68]"
        className="w-fit"
      >
        <RefreshCw size={16} />
        Start New Migration
      </OvalButton>
    </div>
  );
}
