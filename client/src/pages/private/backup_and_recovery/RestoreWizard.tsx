import React, { useState } from "react";
import { ArrowLeft, ArrowRight, HardDriveDownload } from "lucide-react";

import CustomButton from "../../../components/ui/CustomButton";

import StepBar from "../../../components/steps/StepBar";
import { UploadStep } from "../../../components/steps/restore/UploadStep";
import { SelectStep } from "../../../components/steps/restore/SelectStep";
import { ResultsStep } from "../../../components/steps/restore/ResultsStep";
import { DestinationStep } from "../../../components/steps/restore/DestinationStep";
import { RestoreExecStep } from "../../../components/steps/restore/RestoreExecStep";

import { RestoreData } from "../../../types/types";
import StepHeadingCard from "@/src/components/steps/StepHeadingCard";

const steps = [
  {
    id: 1,
    name: "Upload",
    heading: "Upload Backup File",
    description: (
      <>
        Upload a <strong>.zip</strong> (full backup) or <strong>.json</strong>{" "}
        (selective backup) created by the Backup tool.
      </>
    ),
  },
  {
    id: 2,
    name: "Select",
    heading: "Select What to Restore",
    description:
      "Choose the network from the backup and which configuration categories to restore.",
  },
  {
    id: 3,
    name: "Destination",
    heading: "Select Destination Meraki Network",
    description:
      "Connect to the Meraki dashboard where you want to restore the configuration.",
  },
  {
    id: 4,
    name: "Restore",
    heading: "Restore",
    description: "Push selected categories to the target network.",
  },
  {
    id: 5,
    name: "Results",
    heading: "Restore Results",
    description: "View results",
  },
];

const DEFAULT_DATA: RestoreData = {
  fileType: null,
  fileName: "",
  parsedBackup: null,
  selectedNetworkId: "",
  restoreCategories: {
    // Organization
    orgDetails: true,
    orgAdmins: true,
    orgPolicyObjects: true,
    orgPolicyObjectGroups: true,
    orgSnmp: true,
    orgVpnFirewallRules: true,
    orgThirdPartyVpn: true,
    orgAlertProfiles: true,
    orgBrandingPolicies: true,
    orgBrandingPoliciesPriorities: true,
    orgConfigTemplates: true,
    orgLoginSecurity: true,
    orgSamlRoles: true,
    orgApplianceSecurityIntrusion: true,
    orgWebhooks: true,
    // Appliance
    vlans: true,
    applianceFirewallL3: true,
    applianceFirewallL7: true,
    cellularFirewallRules: true,
    inboundFirewallRules: true,
    oneToManyNat: true,
    oneToOneNat: true,
    portForwardingRules: true,
    applianceStaticRoutes: true,
    contentFiltering: true,
    applianceSecurity: true,
    trafficShaping: true,
    trafficShapingGeneral: true,
    customPerformanceClasses: true,
    applianceSettings: true,
    applianceConnectivityMonitoring: true,
    applianceUplinksSettings: true,
    siteToSiteVpn: true,
    bgpSettings: true,
    // Switch
    switchPorts: true,
    switchRoutingInterfaces: true,
    switchAcls: true,
    switchAccessPolicies: true,
    switchSettings: true,
    networkStp: true,
    portSchedules: true,
    qosRules: true,
    dhcpServerPolicy: true,
    stormControl: true,
    switchMtu: true,
    switchOspf: true,
    switchLinkAggregations: true,
    // Wireless
    ssids: true,
    ssidFirewallRules: true,
    ssidTrafficShaping: true,
    ssidBonjourForwarding: true,
    ssidDeviceTypeGroupPolicies: true,
    ssidHotspot20: true,
    ssidIdentityPsks: true,
    ssidSchedules: true,
    ssidSplashSettings: true,
    ssidVpnSettings: true,
    wirelessRfProfiles: true,
    bluetoothSettings: true,
    wirelessSettings: true,
    alternateManagementInterface: true,
    wirelessBilling: true,
    // Network General
    networkDetails: true,
    groupPolicies: true,
    syslogServers: true,
    networkSnmp: true,
    networkAlerts: true,
    networkSettings: true,
    floorPlans: true,
    netflowSettings: true,
    trafficAnalysis: true,
    vlanProfiles: true,
    networkWebhooks: true,
    // Device - General
    managementInterface: true,
    wirelessRadioSettings: true,
    // Device - Switch
    deviceSwitchOspf: true,
    deviceSwitchStp: true,
    // Device - Appliance
    deviceApplianceUplink: true,
    deviceApplianceDhcpSubnets: true,
  },
  destinationApiKey: "",
  destinationRegion: "com",
  destinationOrg: null,
  destinationNetwork: null,
  destinationDevices: [],
  results: null,
};

export function RestoreWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<RestoreData>(DEFAULT_DATA);

  const updateData = (patch: Partial<RestoreData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setData(DEFAULT_DATA);
    setCurrentStep(1);
  };

  function canProceedToNext(): boolean {
    switch (currentStep) {
      case 1:
        return data.parsedBackup !== null;
      case 2:
        return data.selectedNetworkId !== "";
      case 3:
        return (
          !!data.destinationApiKey &&
          !!data.destinationOrg &&
          !!data.destinationNetwork
        );
      default:
        return false;
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <UploadStep data={data} onUpdate={updateData} />;
      case 2:
        return <SelectStep data={data} onUpdate={updateData} />;
      case 3:
        return <DestinationStep data={data} onUpdate={updateData} />;
      case 4:
        return (
          <RestoreExecStep
            data={data}
            onUpdate={updateData}
            onComplete={handleNext}
          />
        );
      case 5:
        return <ResultsStep data={data} onReset={handleReset} />;
      default:
        return null;
    }
  };

  const isAutoStep = currentStep >= 4;

  const heading = steps?.find((step) => step?.id == currentStep).heading;
  const description = steps?.find(
    (step) => step?.id == currentStep,
  ).description;

  return (
    <div className="px-16 py-8">
      <div className="flex flex-col gap-4">
        {/* Step content */}
        <div className="border border-[#87D2ED] rounded-lg overflow-hidden">
          <div className="step-card-layout">
            <StepHeadingCard
              icon={HardDriveDownload}
              heading={heading}
              subHeading={description}
            />

            {/* Step indicator */}
            <StepBar steps={steps} currentStep={currentStep} />

            {renderStep()}
          </div>

          {/* Navigation */}
          {!isAutoStep && (
            <div className="flex items-center justify-between bg-white border-t-2 px-10 py-6">
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
