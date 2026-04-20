import {
  CheckCircle2,
  Download,
  FileArchive,
  RefreshCw,
  XCircle,
  FolderClosed,
  CloudUpload,
  ServerCog,
  RotateCcw,
} from "lucide-react";

import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import AlertCard from "../../ui/AlertCard";
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
          className={`p-3 mb-2 mx-auto rounded-full ${hasMigrationErrors ? "bg-orange-100" : "bg-green-100"}`}
        >
          <CheckCircle2
            size={30}
            className={`${hasMigrationErrors ? "text-orange-500" : "text-green-600"}`}
          />
        </div>

        <p className="font-bold text-2xl text-[#003E68]">
          Migration Process Complete
        </p>

        <p className="text-green-600">
          Migration completed in <strong>{formattedDuration}...</strong>
        </p>

        <p className="text-[#64748B]">
          {hasMigrationErrors ? (
            <p>Migration completed with some errors.</p>
          ) : (
            <p>
              Successfully migrated devices from{" "}
              <span className="font-medium">{sourceOrg?.name}</span> to{" "}
              <span className="font-medium">{destinationOrg?.name}</span>.
            </p>
          )}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 w-full">
        {[
          {
            icon: (
              <div className="p-2 bg-[#D0E4FF4D] rounded-lg">
                <CloudUpload size={20} color="#003E68" />
              </div>
            ),
            stepNo: "06",
            label: "Backup: Complete",
            description:
              "Pre-migration snapshot successfully encrypted and stored.",
          },
          {
            icon: (
              <div className="p-2 bg-[#D0F0594D] rounded-lg">
                <ServerCog size={20} color="#191C1D" />
              </div>
            ),
            stepNo: "08",
            label: "Migration: ",
            description: (
              <div>
                <p className="flex items-center gap-2">
                  <div className="p-0.5 bg-[#D0F059] rounded-full"></div>
                  <span>{migrationSuccess.length} Moved</span>
                </p>

                <p className="flex items-center gap-2">
                  {migrationSuccess.length > 0 && (
                    <>
                      <div className="p-0.5 bg-red-500 rounded-full"></div>
                      <p className="text-red-500">{6} Failed</p>
                    </>
                  )}
                </p>
              </div>
            ),
          },
          {
            icon: (
              <div className="p-2 bg-[#00568D] rounded-lg">
                <RotateCcw size={20} color="white" />
              </div>
            ),
            stepNo: "09",
            label: "Restore: Confirmed",
            description: (
              <div>
                <p className="flex items-center gap-2">
                  <div className="p-0.5 bg-[#D0F059] rounded-full"></div>
                  <span>
                    {restoreDeviceSuccessCount} Device configs restored
                  </span>
                </p>

                <p className="flex items-center gap-2">
                  <div className="p-0.5 bg-[#D0F059] rounded-full"></div>
                  <span>
                    {restoreNetworkSuccessCount} Network configs restored
                  </span>
                </p>
              </div>
            ),
          },
        ].map((data, idx) => (
          <div
            key={data.label || idx}
            className={`col-span-3 sm:col-span-1 p-5 flex flex-col gap-5 bg-white border border-[#C1C7D11A] rounded-md shadow-[0_0_1px_0_rgba(0,0,0,0.25)]`}
          >
            <div className="flex items-center justify-between">
              {data?.icon}

              <div className="font-medium uppercase text-xs text-[#94A3B8]">
                step {data?.stepNo}
              </div>
            </div>

            <div className="space-y-1 text-left">
              <h3 className="text-lg font-semibold text-[#003E68] mb-1 group-hover:text-blue-600 transition-all">
                {data.label}
              </h3>
              <p className="text-[11px] text-[#64748B] leading-relaxed line-clamp-2">
                {data.description}
              </p>
            </div>
          </div>
        ))}
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
      <AlertCard variant="blue">
        <div className="font-semibold">Next Steps:</div>

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
