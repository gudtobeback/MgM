import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SourceConnectionStep } from './steps/migration/SourceConnectionStep';
import { SourceOrganizationStep } from './steps/migration/SourceOrganizationStep';
import { DestinationSetupStep } from './steps/migration/DestinationSetupStep';
import { DestinationOrganizationStep } from './steps/migration/DestinationOrganizationStep';
import { BackupStep } from './steps/migration/BackupStep';
import { PreliminaryConfigStep } from './steps/migration/PreliminaryConfigStep';
import { ReviewStep } from './steps/ReviewStep';
import { MigrationStep } from './steps/MigrationStep';
import { RestoreStep } from './steps/migration/RestoreStep';
import { ResultsStep } from './steps/ResultsStep';
import { getNetworkDevices } from '../services/merakiService';

import { MerakiDeviceDetails, MerakiNetwork, MerakiOrganization, BackupFile } from '../types';

const steps = [
  { id: 1,  name: 'Source',       description: 'Connect .com dashboard' },
  { id: 2,  name: 'Source Org',   description: 'Select source org & network' },
  { id: 3,  name: 'Destination',  description: 'Connect .in dashboard' },
  { id: 4,  name: 'Dest Org',     description: 'Select destination' },
  { id: 5,  name: 'Review',       description: 'Review migration plan' },
  { id: 6,  name: 'Backup',       description: 'Automatic backup' },
  { id: 7,  name: 'Pre-Config',   description: 'Transfer foundational configs' },
  { id: 8,  name: 'Migrate',      description: 'Execute migration' },
  { id: 9,  name: 'Restore',      description: 'Restore configurations' },
  { id: 10, name: 'Results',      description: 'View results' },
];

export interface MigrationData {
  sourceApiKey: string;
  sourceRegion: string;
  destinationApiKey: string;
  destinationRegion: string;
  sourceOrg: MerakiOrganization | null;
  sourceNetwork: MerakiNetwork | null;
  destinationOrg: MerakiOrganization | null;
  destinationNetwork: MerakiNetwork | null;
  devicesToMigrate: MerakiDeviceDetails[];
  reviewConfirmation: string;

  // For backup/restore
  backupBlob: Blob | null;
  backupFilename: string;
  restoreData: BackupFile | null;

  // For results
  migrationSuccess: MerakiDeviceDetails[];
  migrationErrors: { device: MerakiDeviceDetails, error: string }[];
  restoreDeviceSuccessCount: number;
  restoreNetworkSuccessCount: number;
}

export function MigrationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isFetchingReviewData, setIsFetchingReviewData] = useState(false);
  const [migrationData, setMigrationData] = useState<MigrationData>({
    sourceApiKey: '',
    sourceRegion: 'com',
    destinationApiKey: '',
    destinationRegion: 'in',
    sourceOrg: null,
    sourceNetwork: null,
    destinationOrg: null,
    destinationNetwork: null,
    devicesToMigrate: [],
    reviewConfirmation: '',
    backupBlob: null,
    backupFilename: '',
    restoreData: null,
    migrationSuccess: [],
    migrationErrors: [],
    restoreDeviceSuccessCount: 0,
    restoreNetworkSuccessCount: 0,
  });

  // Fetch devices from the selected source network when entering the Review step
  useEffect(() => {
    if (currentStep === 5 && migrationData.sourceNetwork && migrationData.devicesToMigrate.length === 0) {
      const fetchDevicesForReview = async () => {
        setIsFetchingReviewData(true);
        try {
          const devices = await getNetworkDevices(migrationData.sourceApiKey, migrationData.sourceRegion, migrationData.sourceNetwork!.id);
          updateMigrationData({ devicesToMigrate: devices });
        } catch (error) {
          console.error('Failed to fetch devices for review:', error);
        } finally {
          setIsFetchingReviewData(false);
        }
      };
      fetchDevicesForReview();
    }
  }, [currentStep, migrationData.sourceNetwork, migrationData.sourceApiKey, migrationData.devicesToMigrate.length]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateMigrationData = (data: Partial<MigrationData>) => {
    setMigrationData(prev => ({ ...prev, ...data }));
  };

  const handleReset = () => {
    setMigrationData({
      sourceApiKey: '',
      sourceRegion: 'com',
      destinationApiKey: '',
      destinationRegion: 'in',
      sourceOrg: null,
      sourceNetwork: null,
      destinationOrg: null,
      destinationNetwork: null,
      devicesToMigrate: [],
      reviewConfirmation: '',
      backupBlob: null,
      backupFilename: '',
      restoreData: null,
      migrationSuccess: [],
      migrationErrors: [],
      restoreDeviceSuccessCount: 0,
      restoreNetworkSuccessCount: 0,
    });
    setCurrentStep(1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:  return <SourceConnectionStep data={migrationData} onUpdate={updateMigrationData} />;
      case 2:  return <SourceOrganizationStep data={migrationData} onUpdate={updateMigrationData} />;
      case 3:  return <DestinationSetupStep data={migrationData} onUpdate={updateMigrationData} />;
      case 4:  return <DestinationOrganizationStep data={migrationData} onUpdate={updateMigrationData} />;
      case 5:  return <ReviewStep data={migrationData} onUpdate={updateMigrationData} isLoading={isFetchingReviewData} />;
      case 6:  return <BackupStep data={migrationData} onUpdate={updateMigrationData} onComplete={handleNext} />;
      case 7:  return <PreliminaryConfigStep data={migrationData} onUpdate={updateMigrationData} onComplete={handleNext} />;
      case 8:  return <MigrationStep data={migrationData} onUpdate={updateMigrationData} onComplete={handleNext} />;
      case 9:  return <RestoreStep data={migrationData} onUpdate={updateMigrationData} onComplete={handleNext} />;
      case 10: return <ResultsStep data={migrationData} onReset={handleReset} />;
      default: return null;
    }
  };

  function canProceedToNext() {
    switch (currentStep) {
      case 1: return !!migrationData.sourceApiKey;
      case 2: return !!migrationData.sourceOrg && !!migrationData.sourceNetwork;
      case 3: return !!migrationData.destinationApiKey;
      case 4: return !!migrationData.destinationOrg && !!migrationData.destinationNetwork;
      case 5: return migrationData.reviewConfirmation === 'MIGRATE' && !isFetchingReviewData;
      default: return false;
    }
  }

  // Steps 6–10 run automatically (no manual Next button)
  const isAutoStep = currentStep >= 6;

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '24px 24px 32px' }}>

      {/* Step indicator */}
      <nav aria-label="Migration steps" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
              <React.Fragment key={step.id}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px', maxWidth: '68px' }}>
                  {/* Circle */}
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: 'background 200ms, border 200ms',
                    backgroundColor: isCompleted ? '#048a24' : isActive ? '#048a24' : '#ffffff',
                    border: isCompleted ? '2px solid #048a24' : isActive ? '2px solid #048a24' : '2px solid #d1d5db',
                    color: isCompleted || isActive ? '#ffffff' : '#9ca3af',
                  }}>
                    {isCompleted
                      ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : step.id
                    }
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#048a24' : isCompleted ? '#374151' : '#9ca3af',
                    marginTop: '5px',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '60px',
                  }}>
                    {step.name}
                  </span>
                </div>
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    marginTop: '14px',
                    backgroundColor: currentStep > step.id ? '#048a24' : '#e5e7eb',
                    minWidth: '4px',
                    transition: 'background 200ms',
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
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
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
