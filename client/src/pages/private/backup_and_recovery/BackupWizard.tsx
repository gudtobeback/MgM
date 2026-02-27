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

const STEPS = [
  { id: 1, name: "Connect", description: "Connect to Meraki dashboard" },
  { id: 2, name: "Organization", description: "Select organization" },
  { id: 3, name: "Devices", description: "Select devices to backup" },
  { id: 4, name: "Backup", description: "Execute backup" },
  { id: 5, name: "Download", description: "Download backup file" },
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
        return backupData.selectedDevices.length > 0;
      default:
        return false;
    }
  }

  // Steps 4–5 run automatically (no manual Next button)
  const isAutoStep = currentStep >= 4;

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
          <BackupDeviceSelectionStep
            data={backupData}
            onUpdate={updateBackupData}
          />
        );
      case 4:
        return (
          <BackupExecutionStep
            data={backupData}
            onComplete={handleNext}
            onUpdate={updateBackupData}
          />
        );
      case 5:
        return <BackupResultsStep data={backupData} onReset={handleReset} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="p-4 font-medium">Backup Config</div>

      {/* Step indicator */}
      <StepBar steps={STEPS} currentStep={currentStep} />

      <div className="px-16 py-8">
        {/* Step content */}
        <div className="rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)] overflow-hidden">
          {renderStep()}

          {/* Navigation */}
          {!isAutoStep && (
            <div className="flex items-center justify-between bg-[#E7E7E7] p-6">
              <CustomButton
                onClick={handleBack}
                text_prop="text-black"
                bg_prop="bg-white"
                className="border border-gray-300 shadow-[0_0px_2px_rgba(0,0,0,0.25)] enabled:hover:shadow-[0_0px_2px_rgba(0,0,0,0.50)]"
                disabled={currentStep === 1}
              >
                <ArrowLeft size={16} />
                Back
              </CustomButton>

              <CustomButton onClick={handleNext} disabled={!canProceedToNext()}>
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
