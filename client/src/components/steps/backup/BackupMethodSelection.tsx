import React, { useState } from "react";

import {
  PlayCircle,
  Archive,
  ListChecks,
  HardDriveDownload,
} from "lucide-react";

import StepHeadingCard from "../StepHeadingCard";

import { Card } from "../../ui/card";
import { Button } from "../../ui/button";

interface BackupMethodSelectionProps {
  data: any;
  handleNext: () => void;
  setBackupType: (type: any) => void;
  setCurrentStep: any;
}

export default function BackupMethodSelection({
  data,
  handleNext,
  setBackupType,
  setCurrentStep,
}: BackupMethodSelectionProps) {
  const isDataReady = !!data.apiKey && !!data.organization?.id;

  return (
    <div className="step-card-inner-layout">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Selective Backup Card */}
        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-3">
            <ListChecks className="w-8 h-8 text-[#049FD9]" />
            <h3 className="text-lg font-semibold">Selective Device Backup</h3>
          </div>
          <p className="text-muted-foreground mt-2 flex-grow">
            Create a lightweight JSON backup containing only the devices that
            you will select. Good for targeted restores.
          </p>
          <Button
            onClick={() => {
              setBackupType("selective");
              handleNext();
            }}
            className="w-full mt-4"
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            Select Devices for Backup
          </Button>
        </Card>

        {/* Full Backup Card */}
        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-3">
            <Archive className="w-8 h-8 text-blue-600" />
            <h3 className="text-lg font-semibold">Full Organization Backup</h3>
          </div>
          <p className="text-muted-foreground mt-2 flex-grow">
            {/* FIX: Changed UI text from JSON backup to ZIP archive for clarity. */}
            Create a comprehensive ZIP archive of{" "}
            <strong>all configurations</strong> for all devices, networks, and
            the entire organization. This is the most complete backup but may
            take several minutes.
          </p>

          <Button
            onClick={() => {
              setBackupType("full");
              setCurrentStep(5);
            }}
            disabled={!isDataReady}
            className="w-full mt-4"
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            Start Full Backup
          </Button>
        </Card>
      </div>
    </div>
  );
}
