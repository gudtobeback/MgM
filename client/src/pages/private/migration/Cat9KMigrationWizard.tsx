import React, { useState } from "react";

import { ArrowLeft, ArrowRight, ArrowRightLeft } from "lucide-react";

import CustomButton from "../../../components/ui/CustomButton";

import StepBar from "../../../components/steps/StepBar";
import { ClaimStep } from "../../../components/steps/cat9k/ClaimStep";
import { ApplyStep } from "../../../components/steps/cat9k/ApplyStep";
import { UploadStep } from "../../../components/steps/cat9k/UploadStep";
import { ReviewStep } from "../../../components/steps/cat9k/ReviewStep";
import { ResultsStep } from "../../../components/steps/cat9k/ResultsStep";
import { DestinationStep } from "../../../components/steps/cat9k/DestinationStep";

import { Cat9KData } from "../../../types/types";
import StepHeadingCard from "@/src/components/steps/StepHeadingCard";

interface Cat9KMigrationWizardProps {
  connectedOrgs?: any[];
  selectedOrgId?: string;
}

const steps = [
  {
    id: 1,
    name: "Upload",
    heading: "Upload IOS-XE Running Configuration",
    description: (
      <>
        Upload a <code>.txt</code> or <code>.cfg</code> file from your Cisco
        Catalyst 9000 switch, or paste the running-config directly. The parser
        will extract VLANs, switch port configurations, RADIUS servers, and
        ACLs.
      </>
    ),
  },
  {
    id: 2,
    name: "Review",
    heading: "Review Parsed Configuration",
    description:
      "Review the items extracted from the running-config and select which categories to apply to the destination Meraki network.",
  },
  {
    id: 3,
    name: "Destination",
    heading: "Select Destination Meraki Network",
    description:
      "Choose the Meraki network where the translated configuration will be pushed. The target network should contain Catalyst 9K devices under Meraki cloud management.",
  },
  {
    id: 4,
    name: "Claim",
    heading: "Claim Device(s) to Meraki Dashboard",
    description:
      "Before pushing configuration, the Catalyst 9K switch must be registered with Meraki and claimed to the destination network.",
  },
  {
    id: 5,
    name: "Apply",
    heading: "Apply",
    description: "Pushing Configurations",
  },
  {
    id: 6,
    name: "Results",
    heading: "Cat9k Migration Results",
    description: "Overview",
  },
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
    if (currentStep < steps.length) setCurrentStep((s) => s + 1);
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

  const heading = steps?.find((step) => step?.id == currentStep).heading;
  const description = steps?.find(
    (step) => step?.id == currentStep,
  ).description;

  return (
    <div className="px-16 py-8">
      {/* Step content */}
      <div className="border border-[#87D2ED] rounded-lg overflow-hidden">
        <div className="step-card-layout">
          {/* Heading */}
          <StepHeadingCard heading={heading} subHeading={description} />

          {/* Step indicator */}
          <StepBar steps={steps} currentStep={currentStep} />

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
    </div>
  );
}
