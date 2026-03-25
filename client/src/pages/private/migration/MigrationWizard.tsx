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

import { MigrationData } from "../../../types/types";
import StepHeadingCard from "@/src/components/steps/StepHeadingCard";

const Section = ({ title, children }) => (
  <div className="bg-white shadow-sm border rounded-xl p-6 mb-6">
    <h2 className="text-lg font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

const Badge = ({ text, type }) => {
  const styles = {
    success: "bg-green-100 text-green-700",
    danger: "bg-red-100 text-red-700",
    warning: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded ${styles[type]}`}>{text}</span>
  );
};

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

  const heading = steps?.find((step) => step?.id == currentStep).heading;
  const description = steps?.find(
    (step) => step?.id == currentStep,
  ).description;

  return (
    <div className="px-16 py-8">
      {isChecked ? (
        // Step content
        <div className="border border-[#87D2ED] rounded-lg overflow-hidden">
          <div className="step-card-layout">
            {/* Heading */}
            <StepHeadingCard heading={heading} subHeading={description} />

            {/* Step indicator */}
            <StepBar steps={steps} currentStep={currentStep} />

            {/* shadow-[0_2px_16px_rgba(0,0,0,0.25)] */}
            {renderStep()}
          </div>

          {/* Navigation */}
          {!isAutoStep && (
            <div className="flex items-center justify-between bg-white border-t-2 px-10 py-6">
              <CustomButton
                onClick={handleBack}
                disabled={currentStep === 1}
                text_prop="text-black"
                bg_prop="bg-white"
                className="ring-1 ring-[#049FD9] enabled:hover:ring-2"
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
      ) : (
        // CheckList Page
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">
              Meraki Migrate — Pre-Migration Checklist
            </h1>

            {/* Licensing */}
            <Section title="1. Licensing — Validate First">
              <p className="text-sm text-gray-600 mb-4">
                Licensing must be resolved before starting the migration.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Source Org</th>
                      <th className="p-2 text-left">Target Org</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-2">Co-Term</td>
                      <td className="p-2">Co-Term</td>
                      <td className="p-2">
                        <Badge text="Supported" type="success" />
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-2">Per-Device</td>
                      <td className="p-2">Per-Device (new org)</td>
                      <td className="p-2">
                        <Badge text="Supported" type="success" />
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-2">Per-Device</td>
                      <td className="p-2">Co-Term</td>
                      <td className="p-2">
                        <Badge text="Not Possible" type="danger" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-700 font-medium">
                  ⛔ Per-Device → Co-Term is a hard blocker.
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Migration cannot proceed due to platform restrictions.
                </p>
              </div>
            </Section>

            {/* Network */}
            <Section title="2. Network — Run Outside Migrating Network">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
                <p className="text-sm text-yellow-700 font-medium">
                  ⚠️ Devices will restart during migration.
                </p>
              </div>

              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                <li>Use a separate network (4G/5G or different office)</li>
                <li>Use a jump server or cloud VM</li>
                <li>Ensure stable connection before starting</li>
              </ul>
            </Section>

            {/* Order */}
            <Section title="3. Correct Order of Operations">
              <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
                <li>Validate licensing model</li>
                <li>Complete license migration</li>
                <li>Confirm licenses are active</li>
                <li>Run tool outside migrating network</li>
                <li>Start migration workflow</li>
              </ol>
            </Section>

            {/* Requirements */}
            <Section title="4. Other Requirements">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                <li>User must be Org Admin in both orgs</li>
                <li>Enable Meraki Dashboard API</li>
                <li>Target org must be pre-created</li>
                <li>Allow HTTPS (port 443) to api.meraki.com</li>
              </ul>
            </Section>

            <div className="w-full flex justify-end">
              <CustomButton
                onClick={() => setIsChecked(true)}
                className="self-end"
              >
                Agree
              </CustomButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
