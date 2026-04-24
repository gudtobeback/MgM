import React, { useState, useEffect } from "react";

import { ArrowLeft, ArrowRight } from "lucide-react";

import CustomButton from "../../../components/ui/CustomButton";

import StepBar from "../../../components/steps/StepBar";
import PreMigrationChecklist from "./PreMigrationChecklist";
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

import { MigrationData } from "../../../types/types";
import PageHeader from "@/src/components/ui/PageHeader";
import OvalButton from "@/src/components/home/OvalButton";

const steps = [
  {
    id: 1,
    name: "Source",
    heading: "Connect to Source Dashboard",
    description:
      "Select the Meraki region and enter your API key for the dashboard you want to migrate from.",
  },
  {
    id: 2,
    name: "Source Org",
    heading: "Select Source Organization & Network",
    description:
      "Choose the organization from your source dashboard that you want to migrate.",
  },
  {
    id: 3,
    name: "Destination",
    heading: "Connect to Destination Dashboard",
    description:
      "Select the Meraki region and enter your API key for the dashboard you want to migrate to.",
  },
  {
    id: 4,
    name: "Dest Org",
    heading: "Select Destination Organization & Network",
    description:
      "Choose the organization from your source dashboard that you want to migrate.",
  },
  {
    id: 5,
    name: "Review",
    heading: "Review Migration Plan",
    description: "Review all settings before we begin the migration process.",
  },
  {
    id: 6,
    name: "Backup",
    heading: "Pre-Migration Backup",
    description:
      "Performing a full, exhaustive backup of the source organization. This is a critical safety step.",
  },
  {
    id: 7,
    name: "Pre-Config",
    heading: "Pre-Config Transfer",
    description:
      "Copying group policies, RF profiles, RADIUS access policies, and VPN configuration to the destination before migrating devices.",
  },
  {
    id: 8,
    name: "Migrate",
    heading: "Migration",
    description: "Moving devices from source to destination dashboard.",
  },
  {
    id: 9,
    name: "Restore",
    heading: "Restore",
    description:
      "Automatically applying backed-up settings to your newly migrated devices.",
  },
  {
    id: 10,
    name: "Results",
    heading: "Migration Results",
    description: "Download Migration file",
  },
];

export function MigrationWizard() {
  const [isChecked, setIsChecked] = useState(false);
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

  const [logStartTime, setLogStartTime] = useState(null);
  const [logDuration, setLogDuration] = useState<number | null>(null);

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
    if (currentStep < steps.length) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
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
            setLogStartTime={setLogStartTime}
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
            logStartTime={logStartTime}
            setLogDuration={setLogDuration}
          />
        );
      case 10:
        return (
          <ResultsStep
            data={migrationData}
            onReset={handleReset}
            logDuration={logDuration}
          />
        );
      default:
        return null;
    }
  };

  function canProceedToNext(): boolean {
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

  const heading = steps?.find((step) => step?.id == currentStep)?.heading;
  const description = steps?.find(
    (step) => step?.id == currentStep,
  )?.description;

  return (
    <div className="p-8">
      {isChecked ? (
        // Step content
        <div className="flex flex-col gap-8">
          {/* Step indicator */}
          <StepBar steps={steps} currentStep={currentStep} />

          {/* Heading */}
          <PageHeader heading={heading} subHeading={description} />

          {/* shadow-[0_2px_16px_rgba(0,0,0,0.25)] */}
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
      ) : (
        // CheckList Page
        <PreMigrationChecklist agree={() => setIsChecked(true)} />
      )}
    </div>
  );
}
