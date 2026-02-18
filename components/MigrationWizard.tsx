import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';
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
  { id: 1, name: 'Source', description: 'Connect .com dashboard' },
  { id: 2, name: 'Source Org', description: 'Select source org & network' },
  { id: 3, name: 'Destination', description: 'Connect .in dashboard' },
  { id: 4, name: 'Dest Org', description: 'Select destination' },
  { id: 5, name: 'Review', description: 'Review migration plan' },
  { id: 6, name: 'Backup', description: 'Automatic backup' },
  { id: 7, name: 'Pre-Config', description: 'Transfer foundational configs' },
  { id: 8, name: 'Migrate', description: 'Execute migration' },
  { id: 9, name: 'Restore', description: 'Restore configurations' },
  { id: 10, name: 'Results', description: 'View results' },
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
      case 1: return <SourceConnectionStep data={migrationData} onUpdate={updateMigrationData} />;
      case 2: return <SourceOrganizationStep data={migrationData} onUpdate={updateMigrationData} />;
      case 3: return <DestinationSetupStep data={migrationData} onUpdate={updateMigrationData} />;
      case 4: return <DestinationOrganizationStep data={migrationData} onUpdate={updateMigrationData} />;
      case 5: return <ReviewStep data={migrationData} onUpdate={updateMigrationData} isLoading={isFetchingReviewData} />;
      case 6: return <BackupStep data={migrationData} onUpdate={updateMigrationData} onComplete={handleNext} />;
      case 7: return <PreliminaryConfigStep data={migrationData} onUpdate={updateMigrationData} onComplete={handleNext} />;
      case 8: return <MigrationStep data={migrationData} onUpdate={updateMigrationData} onComplete={handleNext} />;
      case 9: return <RestoreStep data={migrationData} onUpdate={updateMigrationData} onComplete={handleNext} />;
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
    <div className="w-full max-w-5xl mx-auto p-6 md:p-8 animate-fade-in">

      {/* ── Step indicator ─────────────────────────────────────────────── */}
      <nav aria-label="Migration steps" className="mb-8 overflow-x-auto pb-1 no-scrollbar">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minWidth: '600px' }}>
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
              <React.Fragment key={step.id}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px', maxWidth: '72px' }}>
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
                    fontSize: '9.5px', fontWeight: isActive ? 700 : 500, marginTop: '5px',
                    color: isActive ? '#2563eb' : isCompleted ? '#374151' : '#9ca3af',
                    textAlign: 'center', lineHeight: 1.3, whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px',
                  }}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
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

      {/* ── Step content ─────────────────────────────────────────────── */}
      <div className="glass-card min-h-[480px] p-8 shadow-xl border-white/50 relative overflow-hidden">
        {renderStep()}
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      {!isAutoStep && (
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="pl-2.5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className={cn(
              "pr-2.5 shadow-lg shadow-blue-200/50 transition-all",
              canProceedToNext() ? "hover:scale-105" : ""
            )}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
