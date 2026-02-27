import React, { useState, useEffect } from "react";

import { ArrowLeft, ArrowRight } from "lucide-react";

import CustomButton from "../../../components/ui/CustomButton";

import StepBar from "../../../components/steps/StepBar";
import { ReviewStep } from "../../../components/steps/migration/ReviewStep";
import { BackupStep } from "../../../components/steps/migration/BackupStep";
import { RestoreStep } from "../../../components/steps/migration/RestoreStep";
import { ResultsStep } from "../../../components/steps/migration/ResultsStep";
import { MigrationStep } from "../../../components/steps/migration/MigrationStep";
import { SourceConnectionStep } from "../../../components/steps/migration/SourceConnectionStep";
import { DestinationSetupStep } from "../../../components/steps/migration/DestinationSetupStep";
import { PreliminaryConfigStep } from "../../../components/steps/migration/PreliminaryConfigStep";
import { SourceOrganizationStep } from "../../../components/steps/migration/SourceOrganizationStep";
import { DestinationOrganizationStep } from "../../../components/steps/migration/DestinationOrganizationStep";

import { getNetworkDevices } from "../../../services/merakiService";

import {
  MerakiDeviceDetails,
  MerakiNetwork,
  MerakiOrganization,
  BackupFile,
} from "../../../types/types";

export interface MigrationData {
  sourceApiKey: string;
  sourceRegion: string;
  destinationApiKey: string;
  destinationRegion: string;
  sourceOrg: MerakiOrganization | null;
  sourceNetwork: MerakiNetwork | null;
  destinationOrg: MerakiOrganization | null;
  destinationNetwork: MerakiNetwork | null;
  devicesToMigrate: MerakiDeviceDetails[];
  reviewConfirmation: string;

  // For backup/restore
  backupBlob: Blob | null;
  backupFilename: string;
  restoreData: BackupFile | null;

  // For results
  migrationSuccess: MerakiDeviceDetails[];
  migrationErrors: { device: MerakiDeviceDetails; error: string }[];
  restoreDeviceSuccessCount: number;
  restoreNetworkSuccessCount: number;
}

const steps = [
  { id: 1, name: "Source", description: "Connect .com dashboard" },
  { id: 2, name: "Source Org", description: "Select source org & network" },
  { id: 3, name: "Destination", description: "Connect .in dashboard" },
  { id: 4, name: "Dest Org", description: "Select destination" },
  { id: 5, name: "Review", description: "Review migration plan" },
  { id: 6, name: "Backup", description: "Automatic backup" },
  { id: 7, name: "Pre-Config", description: "Transfer foundational configs" },
  { id: 8, name: "Migrate", description: "Execute migration" },
  { id: 9, name: "Restore", description: "Restore configurations" },
  { id: 10, name: "Results", description: "View results" },
];

export function MigrationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isFetchingReviewData, setIsFetchingReviewData] = useState(false);
  const [migrationData, setMigrationData] = useState<MigrationData>({
    sourceApiKey: "",
    sourceRegion: "com",
    destinationApiKey: "",
    destinationRegion: "in",
    sourceOrg: null,
    sourceNetwork: null,
    destinationOrg: null,
    destinationNetwork: null,
    devicesToMigrate: [],
    reviewConfirmation: "",
    backupBlob: null,
    backupFilename: "",
    restoreData: null,
    migrationSuccess: [],
    migrationErrors: [],
    restoreDeviceSuccessCount: 0,
    restoreNetworkSuccessCount: 0,
  });

  // Fetch devices from the selected source network when entering the Review step
  useEffect(() => {
    if (
      currentStep === 5 &&
      migrationData.sourceNetwork &&
      migrationData.devicesToMigrate.length === 0
    ) {
      fetchDevicesForReview();
    }
  }, [
    currentStep,
    migrationData.sourceNetwork,
    migrationData.sourceApiKey,
    migrationData.devicesToMigrate.length,
  ]);

  const fetchDevicesForReview = async () => {
    setIsFetchingReviewData(true);

    try {
      const devices = await getNetworkDevices(
        migrationData.sourceApiKey,
        migrationData.sourceRegion,
        migrationData.sourceNetwork!.id,
      );
      updateMigrationData({ devicesToMigrate: devices });
    } catch (error) {
      console.error("Failed to fetch devices for review:", error);
    } finally {
      setIsFetchingReviewData(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setMigrationData({
      sourceApiKey: "",
      sourceRegion: "com",
      destinationApiKey: "",
      destinationRegion: "in",
      sourceOrg: null,
      sourceNetwork: null,
      destinationOrg: null,
      destinationNetwork: null,
      devicesToMigrate: [],
      reviewConfirmation: "",
      backupBlob: null,
      backupFilename: "",
      restoreData: null,
      migrationSuccess: [],
      migrationErrors: [],
      restoreDeviceSuccessCount: 0,
      restoreNetworkSuccessCount: 0,
    });
    setCurrentStep(1);
  };

  const updateMigrationData = (data: Partial<MigrationData>) => {
    setMigrationData((prev) => ({ ...prev, ...data }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SourceConnectionStep
            data={migrationData}
            onUpdate={updateMigrationData}
          />
        );
      case 2:
        return (
          <SourceOrganizationStep
            data={migrationData}
            onUpdate={updateMigrationData}
          />
        );
      case 3:
        return (
          <DestinationSetupStep
            data={migrationData}
            onUpdate={updateMigrationData}
          />
        );
      case 4:
        return (
          <DestinationOrganizationStep
            data={migrationData}
            onUpdate={updateMigrationData}
          />
        );
      case 5:
        return (
          <ReviewStep
            data={migrationData}
            onUpdate={updateMigrationData}
            isLoading={isFetchingReviewData}
          />
        );
      case 6:
        return (
          <BackupStep
            data={migrationData}
            onUpdate={updateMigrationData}
            onComplete={handleNext}
          />
        );
      case 7:
        return (
          <PreliminaryConfigStep
            data={migrationData}
            onUpdate={updateMigrationData}
            onComplete={handleNext}
          />
        );
      case 8:
        return (
          <MigrationStep
            data={migrationData}
            onUpdate={updateMigrationData}
            onComplete={handleNext}
          />
        );
      case 9:
        return (
          <RestoreStep
            data={migrationData}
            onUpdate={updateMigrationData}
            onComplete={handleNext}
          />
        );
      case 10:
        return <ResultsStep data={migrationData} onReset={handleReset} />;
      default:
        return null;
    }
  };

  function canProceedToNext() {
    switch (currentStep) {
      case 1:
        return !!migrationData.sourceApiKey;
      case 2:
        return !!migrationData.sourceOrg && !!migrationData.sourceNetwork;
      case 3:
        return !!migrationData.destinationApiKey;
      case 4:
        return (
          !!migrationData.destinationOrg && !!migrationData.destinationNetwork
        );
      case 5:
        return (
          migrationData.reviewConfirmation === "MIGRATE" &&
          !isFetchingReviewData
        );
      default:
        return false;
    }
  }

  // Steps 6–10 run automatically (no manual Next button)
  const isAutoStep = currentStep >= 6;

  return (
    <div className="w-full">
      <div className="p-4 font-medium">Full Migration</div>

      <StepBar steps={steps} currentStep={currentStep} />

      {/* ── Step content ─────────────────────────────────────────────── */}
      <div className="px-16 py-8">
        <div className="rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)] overflow-hidden">
          {renderStep()}

          {/* ── Navigation ───────────────────────────────────────────────── */}
          {!isAutoStep && (
            <div className="flex items-center justify-between bg-[#E7E7E7] p-6">
              <CustomButton
                onClick={handleBack}
                disabled={currentStep === 1}
                text_prop="text-black"
                bg_prop="bg-white"
                className="border border-gray-300 shadow-[0_0px_2px_rgba(0,0,0,0.25)] enabled:hover:shadow-[0_0px_2px_rgba(0,0,0,0.50)]"
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
