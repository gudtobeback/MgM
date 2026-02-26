import {
  CheckCircle2,
  Download,
  FileArchive,
  RefreshCw,
  XCircle,
  ShieldCheck,
  HardDriveUpload,
  DatabaseZap,
} from "lucide-react";

import { MigrationData } from "../../../pages/private/migration/MigrationWizard";

import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import AlertCard from "../../ui/AlertCard";
import CustomButton from "../../ui/CustomButton";

interface ResultsStepProps {
  data: MigrationData;
  onReset: () => void;
}

export function ResultsStep({ data, onReset }: ResultsStepProps) {
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

  return (
    <div className="flex flex-col bg-white">
      <div className="text-center py-6">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${hasMigrationErrors ? "bg-orange-100" : "bg-green-100"}`}
        >
          <CheckCircle2
            size={40}
            className={`${hasMigrationErrors ? "text-orange-600" : "text-green-600"}`}
          />
        </div>
        <h2 className="text-2xl font-bold">Migration Process Complete</h2>
        <p className="text-muted-foreground mt-2">
          {hasMigrationErrors
            ? "Migration completed with some errors."
            : `Successfully migrated devices from ${sourceOrg?.name} to ${destinationOrg?.name}.`}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 p-6">
        <div className="grid md:grid-cols-3 gap-4 w-full">
          <div className="col-span-1 flex flex-col items-center justify-between gap-3 p-6 rounded-lg border w-full">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} />
              Backup
            </div>

            <p className="text-2xl font-bold">Complete</p>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-between gap-3 p-6 rounded-lg border w-full">
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

          <div className="col-span-1 flex flex-col items-center justify-between gap-3 p-6 rounded-lg border w-full">
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
        <div className="flex flex-col gap-5 p-6 rounded-lg border w-full">
          <p>Backup File Information</p>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <FileArchive size={24} className="text-green-600" />
            </div>

            <div className="flex-1 space-y-1">
              <p className="font-mono">{filename}</p>
              <p className="text-muted-foreground text-sm">
                Size: {fileSize} MB | Created: {timestamp}
              </p>
            </div>

            <CustomButton onClick={handleDownload} disabled={!backupBlob}>
              <Download size={16} />
              Download Full Backup
            </CustomButton>
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
        <AlertCard variant="note">
          <p className="font-bold">Next Steps:</p>

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
        </AlertCard>

        <CustomButton onClick={onReset} className="w-fit">
          <RefreshCw size={16} />
          Start New Migration
        </CustomButton>
      </div>
    </div>
  );
}
