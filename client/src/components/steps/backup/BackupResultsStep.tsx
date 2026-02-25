import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Alert, AlertDescription } from "../../ui/alert";
import {
  CheckCircle2,
  Download,
  FileArchive,
  Info,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import CustomButton from "../../ui/CustomButton";
import AlertCard from "../../ui/AlertCard";

interface BackupResultsStepProps {
  data: any;
  onReset: () => void;
}

export function BackupResultsStep({ data, onReset }: BackupResultsStepProps) {
  const {
    selectedDevices = [],
    organization,
    backupBlob,
    backupFilename,
  } = data;
  const timestamp = new Date().toLocaleString();
  const fileSize = backupBlob
    ? (backupBlob.size / 1024 / 1024).toFixed(2)
    : "0.00";
  const isFullBackup = backupFilename?.endsWith(".zip");

  const filename =
    backupFilename ||
    `meraki-backup-${organization?.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json`;

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

  return (
    <div className="flex flex-col bg-white">
      <div className="text-center py-6">
        <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2
            size={40}
            className="text-purple-600 dark:text-purple-400"
          />
        </div>
        <h2 className="text-2xl font-bold">Backup Completed Successfully!</h2>
        <p className="text-muted-foreground mt-2">
          All selected device configurations have been backed up from{" "}
          {organization?.name}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 p-6">
        <div className="grid md:grid-cols-3 gap-4 w-full">
          <div className="col-span-1 flex flex-col items-center justify-between gap-3 p-6 rounded-lg border w-full">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} />
              Devices Backed Up
            </div>

            <p className="text-2xl font-bold">
              {isFullBackup ? (
                <span className="text-3xl">All</span>
              ) : (
                <>
                  <span className="text-3xl">{selectedDevices.length}</span>
                  <span className="text-muted-foreground">devices</span>
                </>
              )}
            </p>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-between gap-3 p-6 rounded-lg border w-full">
            <div className="flex items-center gap-2">Backup Size</div>

            <p className="text-2xl font-bold">
              <span>{fileSize} </span>
              <span className="text-muted-foreground">MB</span>
            </p>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-between gap-3 p-6 rounded-lg border w-full">
            <div className="flex items-center gap-2">Timestamp</div>

            <p className="text-2xl font-bold">
              <p className="flex flex-col items-center">
                <span>{new Date().toLocaleDateString()}</span>
                <span className="text-muted-foreground">
                  {new Date().toLocaleTimeString()}
                </span>
              </p>
            </p>
          </div>
        </div>

        {/* Download Full backup */}
        <div className="flex flex-col gap-5 p-6 rounded-lg border w-full">
          <p>Backup File Information</p>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <FileArchive
                size={24}
                className="text-purple-600 dark:text-purple-400"
              />
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

        {!isFullBackup && selectedDevices.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-4">Backed Up Devices</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedDevices.map((device: any) => (
                <div
                  key={device.id || device.serial}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p>{device.name}</p>
                      <p className="text-muted-foreground font-mono">
                        {device.serial}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="default"
                    className="bg-purple-600 dark:bg-purple-600"
                  >
                    Success
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        <AlertCard variant="success">
          <p>
            <strong>Important:</strong> Store this backup file securely. You'll
            need it to restore device configurations in the future.
          </p>
        </AlertCard>

        <CustomButton onClick={onReset}>
          <RefreshCw size={16} />
          Create Another Backup
        </CustomButton>
      </div>
    </div>
  );
}
