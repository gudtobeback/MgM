import OvalButton from "@/src/components/home/OvalButton";
import {
  CheckCircle2,
  CircleAlert,
  DatabaseZap,
  Download,
  FileArchive,
  FolderClosed,
  HardDriveUpload,
  RefreshCcw,
  ShieldCheck,
  CloudUpload,
  ServerCog,
  RotateCcw,
} from "lucide-react";
import React from "react";

export default function TestUI() {
  const hasMigrationErrors = false;
  const formattedDuration = 267;

  return (
    <div className="flex flex-col gap-6 px-40">
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
              <span className="font-medium">{"sourceOrg?.name"}</span> to{" "}
              <span className="font-medium">{"destinationOrg?.name"}</span>.
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
                  <span>{7} Moved</span>
                </p>

                <p className="flex items-center gap-2">
                  {6 > 0 && (
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
                  <span>{7} Device configs restored</span>
                </p>

                <p className="flex items-center gap-2">
                  <div className="p-0.5 bg-[#D0F059] rounded-full"></div>
                  <span>{2} Network configs restored</span>
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
    </div>
  );
}
