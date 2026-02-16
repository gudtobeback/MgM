import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { restoreDeviceConfiguration, restoreNetworkConfiguration } from '../../../services/merakiService';
import { MigrationData } from '../../MigrationWizard';
import { DeviceBackup, NetworkConfigBackup } from '../../../types';

interface RestoreStepProps {
  data: MigrationData;
  onUpdate: (data: Partial<MigrationData>) => void;
  onComplete: () => void;
}

export function RestoreStep({ data, onComplete, onUpdate }: RestoreStepProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const hasRun = useRef(false);

  const log = (msg: string) => {
    setLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    const startRestore = async () => {
      if (hasRun.current) return;
      hasRun.current = true;
      setIsRestoring(true);

      const { destinationApiKey, destinationRegion, destinationNetwork, migrationSuccess, restoreData } = data;

      if (!restoreData || migrationSuccess.length === 0) {
        log("⏩ No devices were successfully migrated or no restore data is available. Skipping restore step.");
        setIsComplete(true);
        setTimeout(() => onComplete(), 2000);
        return;
      }
      
      log("--- Starting Post-Migration Configuration Restore ---");
      let deviceSuccessCount = 0;
      let networkSuccessCount = 0;

      try {
        // Phase 1: Restore Device-Specific Configurations
        log(`\nFound ${migrationSuccess.length} devices to restore configuration for...`);
        for (const migratedDevice of migrationSuccess) {
            const backupedDevice = restoreData.devices.find(d => d.serial === migratedDevice.serial);
            if (backupedDevice) {
                log(`- Restoring configuration for ${migratedDevice.name} (${migratedDevice.serial})...`);
                const success = await restoreDeviceConfiguration(
                    destinationApiKey, destinationRegion, migratedDevice.serial, backupedDevice.config, log
                );
                if (success) deviceSuccessCount++;
            } else {
                log(`- ⚠️ Could not find backup data for device ${migratedDevice.serial}.`);
            }
        }
        
        // Phase 2: Restore Network-Level Configurations
        log(`\nPreparing to restore network-level configurations to "${destinationNetwork!.name}"...`);
        const uniqueSourceNetworkIds = [...new Set(migrationSuccess.map(d => d.networkId).filter(Boolean))];
        log(`Found ${uniqueSourceNetworkIds.length} unique source networks to restore settings from.`);
        
        for (const netId of uniqueSourceNetworkIds) {
            const networkConfig = restoreData.networkConfigs[netId as string] as NetworkConfigBackup | undefined;
            if (networkConfig) {
                log(`- Restoring configurations from source network ${netId}...`);
                const restoredCount = await restoreNetworkConfiguration(
                    destinationApiKey, destinationRegion, destinationNetwork!.id, networkConfig, log
                );
                networkSuccessCount += restoredCount;
            } else {
                log(`- ⚠️ Could not find backup configuration for source network ${netId}.`);
            }
        }
        
        setIsComplete(true);
        log('\n--- ✅ Restore phase complete! ---');
        onUpdate({ restoreDeviceSuccessCount: deviceSuccessCount, restoreNetworkSuccessCount: networkSuccessCount });
        setTimeout(() => onComplete(), 2000);

      } catch (err: any) {
        const errorMessage = 'A critical error occurred during restore: ' + (err.message || 'Unknown error');
        setError(errorMessage);
        log(`--- ❌ ${errorMessage} ---`);
        console.error('Restore error:', err);
      } finally {
        setIsRestoring(false);
      }
    };
    
    startRestore();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4">
        {isComplete && !error && <CheckCircle2 className="w-8 h-8 text-green-500" />}
        {isComplete && error && <XCircle className="w-8 h-8 text-red-500" />}
        {isRestoring && <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />}
        <h2 className="text-2xl font-bold">
            {isComplete ? 'Restore Phase Complete' : 'Restoring Configurations'}
        </h2>
      </div>
      <p className="text-muted-foreground text-center">
        Automatically applying backed-up settings to your newly migrated devices.
      </p>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Live Restore Log</h3>
        <div className="h-80 bg-[#f5f7f8] border border-[#e5e7eb] font-mono text-sm rounded-md p-4 overflow-y-auto text-[#374151]">
          {logs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap leading-relaxed">{log}</div>
          ))}
          {error && <div className="text-red-600 mt-2 font-semibold">{error}</div>}
        </div>
      </Card>
    </div>
  );
}
