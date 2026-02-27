import React, { useState } from "react";

import { ArrowLeft, ArrowRight } from "lucide-react";

import CustomButton from "../../../components/ui/CustomButton";

import StepBar from "../../../components/steps/StepBar";
import { ClaimStep } from "../../../components/steps/cat9k/ClaimStep";
import { ApplyStep } from "../../../components/steps/cat9k/ApplyStep";
import { UploadStep } from "../../../components/steps/cat9k/UploadStep";
import { ReviewStep } from "../../../components/steps/cat9k/ReviewStep";
import { ResultsStep } from "../../../components/steps/cat9k/ResultsStep";
import { DestinationStep } from "../../../components/steps/cat9k/DestinationStep";

import { ParsedCat9KConfig } from "../../../services/cat9kParser";

import {
  MerakiOrganization,
  MerakiNetwork,
  MerakiDeviceDetails,
} from "../../../types/types";

export interface Cat9KResults {
  portsPushed: number;
  portsFailed: number;
  policiesCreated: number;
  aclRulesPushed: number;
  log: string[];
}

export interface Cat9KData {
  rawConfig: string;
  parsedConfig: ParsedCat9KConfig | null;
  destinationApiKey: string;
  destinationRegion: string;
  destinationOrg: MerakiOrganization | null;
  destinationNetwork: MerakiNetwork | null;
  destinationDevices: MerakiDeviceDetails[];
  applyPorts: boolean;
  applyRadius: boolean;
  applyAcls: boolean;
  results: Cat9KResults | null;
  // Claim step
  claimedDevices: {
    cloudId: string;
    serial: string;
    name: string;
    model: string;
  }[];
  // Apply step checkpoints (stop/resume)
  appliedPorts: string[];
  radiusApplied: boolean;
  aclsApplied: boolean;
  wasStopped: boolean;
}

interface Cat9KMigrationWizardProps {
  connectedOrgs?: any[];
  selectedOrgId?: string;
}

const STEPS = [
  { id: 1, name: "Upload", description: "Upload or paste config" },
  { id: 2, name: "Review", description: "Review parsed items" },
  { id: 3, name: "Destination", description: "Select target network" },
  { id: 4, name: "Claim", description: "Register & claim device" },
  { id: 5, name: "Apply", description: "Push configuration" },
  { id: 6, name: "Results", description: "View results" },
];

export function Cat9KMigrationWizard({
  connectedOrgs = [],
  selectedOrgId,
}: Cat9KMigrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [applyRunKey, setApplyRunKey] = useState(0);
  const [data, setData] = useState<Cat9KData>({
    rawConfig: "",
    parsedConfig: null,
    destinationApiKey: "",
    destinationRegion: "com",
    destinationOrg: null,
    destinationNetwork: null,
    destinationDevices: [],
    applyPorts: true,
    applyRadius: true,
    applyAcls: true,
    results: null,
    claimedDevices: [],
    appliedPorts: [],
    radiusApplied: false,
    aclsApplied: false,
    wasStopped: false,
  });

  const updateData = (patch: Partial<Cat9KData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleResume = () => {
    setApplyRunKey((k) => k + 1);
  };

  const handleReset = () => {
    setData({
      rawConfig: "",
      parsedConfig: null,
      destinationApiKey: "",
      destinationRegion: "com",
      destinationOrg: null,
      destinationNetwork: null,
      destinationDevices: [],
      applyPorts: true,
      applyRadius: true,
      applyAcls: true,
      results: null,
      claimedDevices: [],
      appliedPorts: [],
      radiusApplied: false,
      aclsApplied: false,
      wasStopped: false,
    });
    setApplyRunKey(0);
    setCurrentStep(1);
  };

  function canProceedToNext(): boolean {
    switch (currentStep) {
      case 1:
        return data.rawConfig.length > 0 && data.parsedConfig !== null;
      case 2:
        return true;
      case 3:
        return (
          !!data.destinationApiKey &&
          !!data.destinationOrg &&
          !!data.destinationNetwork
        );
      case 4:
        return data.claimedDevices.length > 0;
      default:
        return false;
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <UploadStep data={data} onUpdate={updateData} />;
      case 2:
        return <ReviewStep data={data} onUpdate={updateData} />;
      case 3:
        return (
          <DestinationStep
            data={data}
            onUpdate={updateData}
            connectedOrgs={connectedOrgs}
            selectedOrgId={selectedOrgId}
          />
        );
      case 4:
        return (
          <ClaimStep
            data={data}
            onUpdate={updateData}
            onComplete={handleNext}
          />
        );
      case 5:
        return (
          <React.Fragment key={applyRunKey}>
            <ApplyStep
              data={data}
              onUpdate={updateData}
              onComplete={handleNext}
              onResume={handleResume}
            />
          </React.Fragment>
        );
      case 6:
        return <ResultsStep data={data} onReset={handleReset} />;
      default:
        return null;
    }
  };

  // Steps 5-6 are auto/results — hide the navigation
  const isAutoStep = currentStep >= 5;

  return (
    <div className="w-full">
      <div className="p-4 font-medium">Cat9K → Meraki</div>

      {/* Step indicator */}
      <StepBar steps={STEPS} currentStep={currentStep} />

      {/* Step content */}
      <div className="px-16 py-8">
        <div className="rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)] overflow-hidden">
          {renderStep()}

          {/* Navigation */}
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
