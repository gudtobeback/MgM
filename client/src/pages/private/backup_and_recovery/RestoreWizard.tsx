import React, { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import CustomButton from "../../../components/ui/CustomButton";

import StepBar from "../../../components/steps/StepBar";
import { UploadStep } from "../../../components/steps/restore/UploadStep";
import { SelectStep } from "../../../components/steps/restore/SelectStep";
import { ResultsStep } from "../../../components/steps/restore/ResultsStep";
import { DestinationStep } from "../../../components/steps/restore/DestinationStep";
import { RestoreExecStep } from "../../../components/steps/restore/RestoreExecStep";

import {
  BackupFile,
  MerakiOrganization,
  MerakiNetwork,
  MerakiDeviceDetails,
  RestoreCategories,
} from "../../../types/types";

const STEPS = [
  { id: 1, name: "Upload", description: "Upload ZIP or JSON backup" },
  { id: 2, name: "Select", description: "Choose what to restore" },
  { id: 3, name: "Destination", description: "Select target network" },
  { id: 4, name: "Restore", description: "Apply configuration" },
  { id: 5, name: "Results", description: "View results" },
];

export interface RestoreResults {
  log: string[];
  restored: number;
  failed: number;
}

export interface RestoreData {
  fileType: "json" | "zip" | null;
  fileName: string;
  parsedBackup: BackupFile | null;
  selectedNetworkId: string;
  restoreCategories: RestoreCategories;
  destinationApiKey: string;
  destinationRegion: string;
  destinationOrg: MerakiOrganization | null;
  destinationNetwork: MerakiNetwork | null;
  destinationDevices: MerakiDeviceDetails[];
  results: RestoreResults | null;
}

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
    if (currentStep < STEPS.length) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
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

  const isAutoStep = currentStep >= 4;

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

  return (
    <div className="w-full">
      <div className="p-4 font-medium">Restore Backup</div>

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
