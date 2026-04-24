import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { CheckCircle2, Download, FileArchive, Info, RefreshCw } from 'lucide-react';

interface BackupResultsStepProps {
  data: any;
  onReset: () => void;
}

export function BackupResultsStep({ data, onReset }: BackupResultsStepProps) {
  const { selectedDevices = [], organization, backupBlob, backupFilename } = data;
  const timestamp = new Date().toLocaleString();
  const fileSize = backupBlob ? (backupBlob.size / 1024 / 1024).toFixed(2) : '0.00';
  const isFullBackup = backupFilename?.endsWith('.zip');
  
  const filename = backupFilename || `meraki-backup-${organization?.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;

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

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold">Backup Completed Successfully!</h2>
        <p className="text-muted-foreground mt-2">
          All selected device configurations have been backed up from {organization?.name}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-2">Devices Backed Up</p>
          <div className="flex items-baseline justify-center gap-2">
            {isFullBackup ? (
                 <span className="text-3xl">All</span>
            ) : (
                <>
                    <span className="text-3xl">{selectedDevices.length}</span>
                    <span className="text-muted-foreground">devices</span>
                </>
            )}
          </div>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-2">Backup Size</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl">{fileSize}</span>
            <span className="text-muted-foreground">MB</span>
          </div>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-2">Timestamp</p>
          <div className="flex flex-col items-center">
            <span>{new Date().toLocaleDateString()}</span>
            <span className="text-muted-foreground">{new Date().toLocaleTimeString()}</span>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4">Backup File Information</h3>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <FileArchive className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-muted-foreground">Filename</p>
              <p className="font-mono">{filename}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Organization</p>
                <p>{organization?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p>{timestamp}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {!isFullBackup && selectedDevices.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-4">Backed Up Devices</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedDevices.map((device: any) => (
                <div key={device.id || device.serial} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p>{device.name}</p>
                      <p className="text-muted-foreground font-mono">{device.serial}</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-purple-600 dark:bg-purple-600">
                    Success
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Store this backup file securely. You'll need it to restore 
          device configurations in the future.
        </AlertDescription>
      </Alert>

      <div className="flex gap-4 justify-center pt-4">
        <Button variant="outline" onClick={onReset} size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Create Another Backup
        </Button>
        <Button onClick={handleDownload} size="lg" disabled={!backupBlob}>
          <Download className="w-4 h-4 mr-2" />
          Download Backup File
        </Button>
      </div>
    </div>
  );
}