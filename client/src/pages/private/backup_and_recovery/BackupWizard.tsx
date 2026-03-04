import React, { useState } from "react";

import { ArrowLeft, ArrowRight } from "lucide-react";

import CustomButton from "../../../components/ui/CustomButton";

import StepBar from "../../../components/steps/StepBar";
import { BackupResultsStep } from "../../../components/steps/backup/BackupResultsStep";
import { BackupExecutionStep } from "../../../components/steps/backup/BackupExecutionStep";
import { BackupConnectionStep } from "../../../components/steps/backup/BackupConnectionStep";
import { BackupOrganizationStep } from "../../../components/steps/backup/BackupOrganizationStep";
import { BackupDeviceSelectionStep } from "../../../components/steps/backup/BackupDeviceSelectionStep";

import { MerakiDeviceDetails, MerakiOrganization } from "../../../types/types";
import BackupMethodSelection from "@/src/components/steps/backup/BackupMethodSelection";

const STEPS = [
  { id: 1, name: "Connect", description: "Connect to Meraki dashboard" },
  { id: 2, name: "Organization", description: "Select organization" },
  { id: 3, name: "Backup Method", description: "Select Backup Method" },
  { id: 4, name: "Devices", description: "Select devices to backup" },
  { id: 5, name: "Backup Execution", description: "Execute backup" },
  { id: 6, name: "Download", description: "Download backup file" },
];

interface BackupData {
  apiKey: string;
  region: "com" | "in";
  organization: MerakiOrganization | null;
  allDevices: MerakiDeviceDetails[];
  selectedDevices: MerakiDeviceDetails[];
  backupBlob: Blob | null;
  backupFilename: string;
}

export function BackupWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [backupData, setBackupData] = useState<BackupData>({
    apiKey: "",
    region: "com",
    organization: null,
    allDevices: [],
    selectedDevices: [],
    backupBlob: null,
    backupFilename: "",
  });

  const [backupType, setBackupType] = useState<"selective" | "full" | null>(
    null,
  );

  const [logTimer, setLogTimer] = useState<number | null>(null);

  const handleNext = () => {
    if (currentStep < STEPS.length) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleReset = () => {
    setBackupData({
      apiKey: "",
      region: "com",
      organization: null,
      allDevices: [],
      selectedDevices: [],
      backupBlob: null,
      backupFilename: "",
    });
    setCurrentStep(1);
  };

  const updateBackupData = (data: Partial<BackupData>) => {
    setBackupData((prev) => ({ ...prev, ...data }));
  };

  function canProceedToNext(): boolean {
    switch (currentStep) {
      case 1:
        return !!backupData.apiKey;
      case 2:
        return !!backupData.organization;
      case 3:
        return false;
      case 4:
        return backupData.selectedDevices.length > 0;
      default:
        return false;
    }
  }

  // Steps 4–5 run automatically (no manual Next button)
  const isAutoStep = currentStep >= 5;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BackupConnectionStep data={backupData} onUpdate={updateBackupData} />
        );
      case 2:
        return (
          <BackupOrganizationStep
            data={backupData}
            onUpdate={updateBackupData}
          />
        );
      case 3:
        return (
          <BackupMethodSelection
            data={backupData}
            handleNext={handleNext}
            setBackupType={setBackupType}
            setCurrentStep={setCurrentStep}
          />
        );
      case 4:
        return (
          <BackupDeviceSelectionStep
            data={backupData}
            onUpdate={updateBackupData}
          />
        );
      case 5:
        return (
          <BackupExecutionStep
            data={backupData}
            backupType={backupType}
            onComplete={handleNext}
            onUpdate={updateBackupData}
            setLogTimer={setLogTimer}
          />
        );
      case 6:
        return (
          <BackupResultsStep
            data={backupData}
            onReset={handleReset}
            logTimer={logTimer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-16 py-8">
      <div className="flex flex-col gap-4">
        {/* Step indicator */}
        <StepBar steps={STEPS} currentStep={currentStep} />

        {/* Step content */}
        <div className="border border-[#87D2ED] rounded-lg overflow-hidden">
          {renderStep()}

          {/* Navigation */}
          {!isAutoStep && (
            <div className="flex items-center justify-between bg-white border-t-2 p-6">
              <CustomButton
                onClick={handleBack}
                text_prop="text-black"
                bg_prop="bg-white"
                className="ring-1 ring-[#049FD9] enabled:hover:ring-2"
                disabled={currentStep === 1}
              >
                <ArrowLeft size={16} />
                Back
              </CustomButton>

              <CustomButton
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="ring-1 ring-[#049FD9] enabled:hover:ring-2"
              >
                Next
                <ArrowRight size={16} />
              </CustomButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
