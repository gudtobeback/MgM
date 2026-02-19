import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BackupFile, MerakiOrganization, MerakiNetwork, MerakiDeviceDetails, RestoreCategories } from '../../types';
import { UploadStep } from './steps/UploadStep';
import { SelectStep } from './steps/SelectStep';
import { DestinationStep } from './steps/DestinationStep';
import { RestoreExecStep } from './steps/RestoreExecStep';
import { ResultsStep } from './steps/ResultsStep';

const STEPS = [
  { id: 1, name: 'Upload',      description: 'Upload ZIP or JSON backup' },
  { id: 2, name: 'Select',      description: 'Choose what to restore' },
  { id: 3, name: 'Destination', description: 'Select target network' },
  { id: 4, name: 'Restore',     description: 'Apply configuration' },
  { id: 5, name: 'Results',     description: 'View results' },
];

export interface RestoreResults {
  log: string[];
  restored: number;
  failed: number;
}

export interface RestoreData {
  fileType: 'json' | 'zip' | null;
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
  fileName: '',
  parsedBackup: null,
  selectedNetworkId: '',
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
  destinationApiKey: '',
  destinationRegion: 'com',
  destinationOrg: null,
  destinationNetwork: null,
  destinationDevices: [],
  results: null,
};

export function RestoreWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<RestoreData>(DEFAULT_DATA);

  const updateData = (patch: Partial<RestoreData>) => {
    setData(prev => ({ ...prev, ...patch }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) setCurrentStep(s => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const handleReset = () => {
    setData(DEFAULT_DATA);
    setCurrentStep(1);
  };

  function canProceedToNext(): boolean {
    switch (currentStep) {
      case 1: return data.parsedBackup !== null;
      case 2: return data.selectedNetworkId !== '';
      case 3: return !!data.destinationApiKey && !!data.destinationOrg && !!data.destinationNetwork;
      default: return false;
    }
  }

  const isAutoStep = currentStep >= 4;

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <UploadStep data={data} onUpdate={updateData} />;
      case 2: return <SelectStep data={data} onUpdate={updateData} />;
      case 3: return <DestinationStep data={data} onUpdate={updateData} />;
      case 4: return <RestoreExecStep data={data} onUpdate={updateData} onComplete={handleNext} />;
      case 5: return <ResultsStep data={data} onReset={handleReset} />;
      default: return null;
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '8px 0 40px' }}>

      {/* Step indicator */}
      <nav aria-label="Restore steps" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
              <React.Fragment key={step.id}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '72px', maxWidth: '88px' }}>
                  <div style={{
                    width: isActive ? '12px' : '10px', height: isActive ? '12px' : '10px',
                    borderRadius: '50%', flexShrink: 0,
                    backgroundColor: (isCompleted || isActive) ? '#2563eb' : '#e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 200ms', marginTop: isActive ? 0 : '1px',
                  }}>
                    {isCompleted && (
                      <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                        <path d="M1 3l1.5 1.5 2.5-2.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontSize: '9.5px', fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#2563eb' : isCompleted ? '#374151' : '#9ca3af',
                    marginTop: '5px', textAlign: 'center', lineHeight: 1.3,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '72px',
                  }}>
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: '1.5px', marginTop: '4px',
                    backgroundColor: currentStep > step.id ? '#2563eb' : '#e5e7eb',
                    minWidth: '4px', transition: 'background 200ms',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </nav>

      {/* Step content */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        padding: '40px',
        borderRadius: '10px',
        border: '1px solid var(--color-border-primary)',
        minHeight: '500px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {renderStep()}
      </div>

      {/* Navigation */}
      {!isAutoStep && (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '28px' }}>
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!canProceedToNext()}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
