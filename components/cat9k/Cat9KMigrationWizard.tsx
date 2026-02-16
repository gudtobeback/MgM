import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ParsedCat9KConfig } from '../../services/cat9kParser';
import { MerakiOrganization, MerakiNetwork, MerakiDeviceDetails } from '../../types';
import { UploadStep } from './steps/UploadStep';
import { ReviewStep } from './steps/ReviewStep';
import { DestinationStep } from './steps/DestinationStep';
import { ApplyStep } from './steps/ApplyStep';
import { ResultsStep } from './steps/ResultsStep';

const STEPS = [
  { id: 1, name: 'Upload',      description: 'Upload or paste config' },
  { id: 2, name: 'Review',      description: 'Review parsed items' },
  { id: 3, name: 'Destination', description: 'Select target network' },
  { id: 4, name: 'Apply',       description: 'Push configuration' },
  { id: 5, name: 'Results',     description: 'View results' },
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
}

export function Cat9KMigrationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
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
    });
    setCurrentStep(1);
  };

  function canProceedToNext(): boolean {
    switch (currentStep) {
      case 1: return data.rawConfig.length > 0 && data.parsedConfig !== null;
      case 2: return true;
      case 3: return !!data.destinationApiKey && !!data.destinationOrg && !!data.destinationNetwork;
      default: return false;
    }
  }

  // Steps 4-5 are auto/results — hide the navigation
  const isAutoStep = currentStep >= 4;

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <UploadStep data={data} onUpdate={updateData} />;
      case 2: return <ReviewStep data={data} onUpdate={updateData} />;
      case 3: return <DestinationStep data={data} onUpdate={updateData} />;
      case 4: return <ApplyStep data={data} onUpdate={updateData} onComplete={handleNext} />;
      case 5: return <ResultsStep data={data} onReset={handleReset} />;
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
                    width: '30px', height: '30px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, flexShrink: 0,
                    transition: 'background 200ms, border 200ms',
                    backgroundColor: isCompleted ? '#2563eb' : isActive ? '#2563eb' : '#ffffff',
                    border: isCompleted ? '2px solid #2563eb' : isActive ? '2px solid #2563eb' : '2px solid #d1d5db',
                    color: (isCompleted || isActive) ? '#ffffff' : '#9ca3af',
                  }}>
                    {isCompleted
                      ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : step.id
                    }
                  </div>
                  <span style={{
                    fontSize: '9.5px', fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#2563eb' : isCompleted ? '#374151' : '#9ca3af',
                    marginTop: '5px', textAlign: 'center', lineHeight: 1.3,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: '72px',
                  }}>
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: '2px', marginTop: '14px',
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
