import React, { useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BackupConnectionStep } from './steps/backup/BackupConnectionStep';
import { BackupOrganizationStep } from './steps/backup/BackupOrganizationStep';
import { BackupDeviceSelectionStep } from './steps/backup/BackupDeviceSelectionStep';
import { BackupExecutionStep } from './steps/backup/BackupExecutionStep';
import { BackupResultsStep } from './steps/backup/BackupResultsStep';
import { MerakiDeviceDetails, MerakiOrganization } from '../types';

const STEPS = [
  { id: 1, name: 'Connect',      description: 'Connect to Meraki dashboard' },
  { id: 2, name: 'Organization', description: 'Select organization' },
  { id: 3, name: 'Devices',      description: 'Select devices to backup' },
  { id: 4, name: 'Backup',       description: 'Execute backup' },
  { id: 5, name: 'Download',     description: 'Download backup file' },
];

interface BackupData {
  apiKey: string;
  region: 'com' | 'in';
  organization: MerakiOrganization | null;
  allDevices: MerakiDeviceDetails[];
  selectedDevices: MerakiDeviceDetails[];
  backupBlob: Blob | null;
  backupFilename: string;
}

export function BackupWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [backupData, setBackupData] = useState<BackupData>({
    apiKey: '',
    region: 'com',
    organization: null,
    allDevices: [],
    selectedDevices: [],
    backupBlob: null,
    backupFilename: '',
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) setCurrentStep(s => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const handleReset = () => {
    setBackupData({
      apiKey: '',
      region: 'com',
      organization: null,
      allDevices: [],
      selectedDevices: [],
      backupBlob: null,
      backupFilename: '',
    });
    setCurrentStep(1);
  };

  const updateBackupData = (data: Partial<BackupData>) => {
    setBackupData(prev => ({ ...prev, ...data }));
  };

  function canProceedToNext(): boolean {
    switch (currentStep) {
      case 1: return !!backupData.apiKey;
      case 2: return !!backupData.organization;
      case 3: return backupData.selectedDevices.length > 0;
      default: return false;
    }
  }

  // Steps 4–5 run automatically (no manual Next button)
  const isAutoStep = currentStep >= 4;

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <BackupConnectionStep data={backupData} onUpdate={updateBackupData} />;
      case 2: return <BackupOrganizationStep data={backupData} onUpdate={updateBackupData} />;
      case 3: return <BackupDeviceSelectionStep data={backupData} onUpdate={updateBackupData} />;
      case 4: return <BackupExecutionStep data={backupData} onComplete={handleNext} onUpdate={updateBackupData} />;
      case 5: return <BackupResultsStep data={backupData} onReset={handleReset} />;
      default: return null;
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '8px 0 40px' }}>

      {/* Step indicator */}
      <nav aria-label="Backup steps" style={{ marginBottom: '28px' }}>
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
