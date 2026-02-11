import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle2, Download, FileArchive, Info, RefreshCw, XCircle, ShieldCheck, HardDriveUpload, DatabaseZap } from 'lucide-react';
import { MigrationData } from '../MigrationWizard';

interface ResultsStepProps {
  data: MigrationData;
  onReset: () => void;
}

export function ResultsStep({ data, onReset }: ResultsStepProps) {
  const { 
      sourceOrg, 
      destinationOrg,
      destinationNetwork,
      backupBlob, 
      backupFilename,
      migrationSuccess,
      migrationErrors,
      restoreDeviceSuccessCount,
      restoreNetworkSuccessCount
    } = data;
    
  const timestamp = new Date().toLocaleString();
  const fileSize = backupBlob ? (backupBlob.size / 1024 / 1024).toFixed(2) : '0.00';
  const filename = backupFilename || `meraki-backup.zip`;

  const handleDownload = () => {
    if (!backupBlob) return;
    const url = URL.createObjectURL(backupBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasMigrationErrors = migrationErrors.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${hasMigrationErrors ? 'bg-orange-100' : 'bg-green-100'}`}>
          <CheckCircle2 className={`w-10 h-10 ${hasMigrationErrors ? 'text-orange-600' : 'text-green-600'}`} />
        </div>
        <h2 className="text-2xl font-bold">Migration Process Complete</h2>
        <p className="text-muted-foreground mt-2">
          {hasMigrationErrors ? 'Migration completed with some errors.' : `Successfully migrated devices from ${sourceOrg?.name} to ${destinationOrg?.name}.`}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2 text-muted-foreground"><ShieldCheck className="w-5 h-5"/>Backup</div>
            <p className="text-2xl font-bold">Complete</p>
        </Card>
        <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2 text-muted-foreground"><HardDriveUpload className="w-5 h-5"/>Migration</div>
            <p className="text-2xl font-bold">{migrationSuccess.length} <span className="text-lg text-muted-foreground">Moved</span></p>
            {migrationErrors.length > 0 && <p className="text-red-500">{migrationErrors.length} Failed</p>}
        </Card>
        <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2 text-muted-foreground"><DatabaseZap className="w-5 h-5"/>Restore</div>
            <p className="text-sm">{restoreDeviceSuccessCount} Device configs restored</p>
            <p className="text-sm">{restoreNetworkSuccessCount} Network configs restored</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4">Backup File Information</h3>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <FileArchive className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-mono">{filename}</p>
            <p className="text-muted-foreground text-sm">Size: {fileSize} MB | Created: {timestamp}</p>
          </div>
          <Button onClick={handleDownload} disabled={!backupBlob}>
            <Download className="w-4 h-4 mr-2" />
            Download Full Backup
          </Button>
        </div>
      </Card>
      
      {migrationErrors.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-4 text-red-600">Migration Errors</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {migrationErrors.map(({ device, error }, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p>{device.name} ({device.serial})</p>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                  <Badge variant="destructive">Failed</Badge>
                </div>
              ))}
            </div>
          </Card>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Next Steps:</strong> Verify the migrated devices in the <a href={`https://dashboard.meraki.in/o/${destinationOrg?.id}/n/${destinationNetwork?.id}/manage/nodes/list`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">destination dashboard</a>. The full backup file can be used for a manual restore if needed.
        </AlertDescription>
      </Alert>

      <div className="flex gap-4 justify-center pt-4">
        <Button variant="outline" onClick={onReset} size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Start New Migration
        </Button>
      </div>
    </div>
  );
}
