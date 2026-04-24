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

import { Cat9KData } from "../../../types/types";
import StepHeadingCard from "@/src/components/steps/StepHeadingCard";
import PageHeader from "@/src/components/ui/PageHeader";
import OvalButton from "@/src/components/home/OvalButton";

interface Cat9KMigrationWizardProps {
  connectedOrgs?: any[];
  selectedOrgId?: string | any;
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
    if (currentStep < steps.length) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
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

  const heading = steps?.find((step) => step?.id == currentStep)?.heading;
  const description = steps?.find(
    (step) => step?.id == currentStep,
  )?.description;

  return (
    <div className="p-8">
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
