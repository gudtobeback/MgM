import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ParsedCat9KConfig } from '../../services/cat9kParser';
import { MerakiOrganization, MerakiNetwork, MerakiDeviceDetails } from '../../types';
import { UploadStep } from './steps/UploadStep';
import { ReviewStep } from './steps/ReviewStep';
import { DestinationStep } from './steps/DestinationStep';
import { ClaimStep } from './steps/ClaimStep';
import { ApplyStep } from './steps/ApplyStep';
import { ResultsStep } from './steps/ResultsStep';

const STEPS = [
  { id: 1, name: 'Upload',      description: 'Upload or paste config' },
  { id: 2, name: 'Review',      description: 'Review parsed items' },
  { id: 3, name: 'Destination', description: 'Select target network' },
  { id: 4, name: 'Claim',       description: 'Register & claim device' },
  { id: 5, name: 'Apply',       description: 'Push configuration' },
  { id: 6, name: 'Results',     description: 'View results' },
];

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
  claimedDevices: { cloudId: string; serial: string; name: string; model: string }[];
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

export function Cat9KMigrationWizard({ connectedOrgs = [], selectedOrgId }: Cat9KMigrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [applyRunKey, setApplyRunKey] = useState(0);
  const [data, setData] = useState<Cat9KData>({
    rawConfig: '',
    parsedConfig: null,
    destinationApiKey: '',
    destinationRegion: 'com',
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
    setData(prev => ({ ...prev, ...patch }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) setCurrentStep(s => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const handleResume = () => {
    setApplyRunKey(k => k + 1);
  };

  const handleReset = () => {
    setData({
      rawConfig: '',
      parsedConfig: null,
      destinationApiKey: '',
      destinationRegion: 'com',
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
      case 1: return data.rawConfig.length > 0 && data.parsedConfig !== null;
      case 2: return true;
      case 3: return !!data.destinationApiKey && !!data.destinationOrg && !!data.destinationNetwork;
      case 4: return data.claimedDevices.length > 0;
      default: return false;
    }
  }

  // Steps 5-6 are auto/results — hide the navigation
  const isAutoStep = currentStep >= 5;

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <UploadStep data={data} onUpdate={updateData} />;
      case 2: return <ReviewStep data={data} onUpdate={updateData} />;
      case 3: return <DestinationStep data={data} onUpdate={updateData} connectedOrgs={connectedOrgs} selectedOrgId={selectedOrgId} />;
      case 4: return <ClaimStep data={data} onUpdate={updateData} onComplete={handleNext} />;
      case 5: return <React.Fragment key={applyRunKey}><ApplyStep data={data} onUpdate={updateData} onComplete={handleNext} onResume={handleResume} /></React.Fragment>;
      case 6: return <ResultsStep data={data} onReset={handleReset} />;
      default: return null;
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '24px 24px 32px' }}>

      {/* Step indicator */}
      <nav aria-label="Cat9K migration steps" style={{ marginBottom: '28px' }}>
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
        padding: '32px',
        borderRadius: '8px',
        border: '1px solid var(--color-border-primary)',
        minHeight: '480px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {renderStep()}
      </div>

      {/* Navigation */}
      {!isAutoStep && (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px' }}>
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
