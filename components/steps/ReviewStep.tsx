import React from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, ArrowRight, Building, Server, AlertTriangle } from 'lucide-react';
import { MigrationData } from '../MigrationWizard';

interface ReviewStepProps {
  data: MigrationData;
  onUpdate: (data: Partial<MigrationData>) => void;
  isLoading: boolean;
}

export function ReviewStep({ data, onUpdate, isLoading }: ReviewStepProps) {

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
                <p className="mt-4 text-muted-foreground">Analyzing source organization and preparing migration plan...</p>
            </div>
        );
    }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review Migration Plan</h2>
        <p className="text-muted-foreground mt-2">
          This is a final summary before executing the migration. Please review carefully.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 items-center">
        {/* Source */}
        <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
                <Building className="w-6 h-6 text-[#2563eb]" />
                <h3 className="font-semibold text-lg">Source</h3>
            </div>
            <div className="space-y-2 text-sm">
                <p><strong className="text-muted-foreground">Dashboard:</strong> dashboard.meraki.com</p>
                <p><strong className="text-muted-foreground">Organization:</strong> {data.sourceOrg?.name}</p>
                <p><strong className="text-muted-foreground">Network:</strong> {data.sourceNetwork?.name}</p>
            </div>
        </Card>
        
        {/* Arrow and device count */}
        <div className="text-center">
            <div className="flex items-center justify-center gap-2">
                <Server className="w-6 h-6 text-muted-foreground" />
                <span className="text-xl font-bold">{data.devicesToMigrate.length} Devices</span>
            </div>
            <ArrowRight className="w-12 h-12 text-primary mx-auto my-2" />
        </div>

        {/* Destination */}
        <Card className="p-6">
             <div className="flex items-center gap-3 mb-4">
                <Building className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-lg">Destination</h3>
            </div>
             <div className="space-y-2 text-sm">
                <p><strong className="text-muted-foreground">Dashboard:</strong> dashboard.meraki.in</p>
                <p><strong className="text-muted-foreground">Organization:</strong> {data.destinationOrg?.name}</p>
                <p><strong className="text-muted-foreground">Network:</strong> {data.destinationNetwork?.name}</p>
            </div>
        </Card>
      </div>

      <Alert variant="destructive" className="bg-red-50 border-red-200">
        <AlertTriangle className="h-4 w-4 !text-red-600" />
        <AlertDescription className="text-red-800">
            <strong>Warning:</strong> This action is irreversible. All devices will be unclaimed from the source and moved. This will cause a service interruption for all devices being migrated. A full backup will be created automatically before migration begins.
        </AlertDescription>
      </Alert>
      
      <Card className="p-6 max-w-lg mx-auto">
        <div className="space-y-2">
            <Label htmlFor="confirmation">To confirm, please type "MIGRATE" below.</Label>
            <Input 
                id="confirmation"
                placeholder='Type "MIGRATE" to proceed'
                value={data.reviewConfirmation}
                onChange={(e) => onUpdate({ reviewConfirmation: e.target.value })}
            />
        </div>
      </Card>

    </div>
  );
}