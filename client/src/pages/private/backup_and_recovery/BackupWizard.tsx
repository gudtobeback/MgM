import React, { useState } from "react";

import { HardDriveDownload, ArrowLeft, ArrowRight } from "lucide-react";

import CustomButton from "../../../components/ui/CustomButton";

import StepBar from "../../../components/steps/StepBar";
import { BackupResultsStep } from "../../../components/steps/backup/BackupResultsStep";
import { BackupExecutionStep } from "../../../components/steps/backup/BackupExecutionStep";
import { BackupConnectionStep } from "../../../components/steps/backup/BackupConnectionStep";
import { BackupOrganizationStep } from "../../../components/steps/backup/BackupOrganizationStep";
import { BackupDeviceSelectionStep } from "../../../components/steps/backup/BackupDeviceSelectionStep";

import { MerakiDeviceDetails, MerakiOrganization } from "../../../types/types";
import BackupMethodSelection from "@/src/components/steps/backup/BackupMethodSelection";
import StepHeadingCard from "@/src/components/steps/StepHeadingCard";
import PageHeader from "@/src/components/ui/PageHeader";
import OvalButton from "@/src/components/home/OvalButton";

const steps = [
  {
    id: 1,
    name: "Connect",
    heading: "Connect to Source Dashboard",
    description:
      "Enter your API key to connect to the dashboard you want to backup.",
  },
  {
    id: 2,
    name: "Organization",
    heading: "Select Organization",
    description: "Choose the organization you want to backup.",
  },
  {
    id: 3,
    name: "Backup Method",
    heading: "Select Backup Method",
    description: "Select Backup Selection Method.",
  },
  {
    id: 4,
    name: "Devices",
    heading: "Select Devices to Backup",
    description:
      "Choose which devices you want to backup from the organization.",
  },
  {
    id: 5,
    name: "Backup Execution",
    heading: "Backup Execution",
    description:
      "Choose the type of backup you want to perform for the organization.",
  },
  {
    id: 6,
    name: "Result",
    heading: "Backup Results",
    description: "Download Backup file",
  },
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

  const [logDuration, setLogDuration] = useState<number | null>(null);

  const handleNext = () => {
    if (currentStep < steps.length) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
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
            setLogDuration={setLogDuration}
          />
        );
      case 6:
        return (
          <BackupResultsStep
            data={backupData}
            onReset={handleReset}
            logDuration={logDuration}
          />
        );
      default:
        return null;
    }
  };

  // Steps 4–5 run automatically (no manual Next button)
  const isAutoStep = currentStep >= 5;

  const heading = steps?.find((step) => step?.id == currentStep)?.heading;
  const description = steps?.find(
    (step) => step?.id == currentStep,
  )?.description;

  return (
    <div className="p-8">
      {/* Step content */}
      <div className="flex flex-col gap-8">
        {/* Step indicator */}
        <StepBar steps={steps} currentStep={currentStep} />

        {/* Heading */}
        <PageHeader heading={heading} subHeading={description} />

        {renderStep()}

        {/* Navigation */}
        {!isAutoStep && (
          <div className="flex items-center justify-between border-t border-gray-200 px-10 py-6">
            <OvalButton
              onClick={handleBack}
              disabled={currentStep === 1}
              text_prop="text-black"
              bg_prop="bg-gray-100 enabled:hover:bg-gray-200"
            >
              <ArrowLeft size={16} />
              Back
            </OvalButton>

            <OvalButton onClick={handleNext} disabled={!canProceedToNext()}>
              Next
              <ArrowRight size={16} />
            </OvalButton>
          </div>
        )}
      </div>
    </div>
  );
}
