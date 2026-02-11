import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card } from '../../ui/card';
import { Globe, Key } from 'lucide-react';

interface BackupConnectionStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function BackupConnectionStep({ data, onUpdate }: BackupConnectionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Connect to Meraki Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Enter your API key to connect to the dashboard you want to backup
        </p>
      </div>

      <Card className="p-6 space-y-4 border-2 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3>Source Dashboard</h3>
            <p className="text-muted-foreground">dashboard.meraki.com</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              className="pl-10"
              value={data.apiKey}
              onChange={(e) => onUpdate({ apiKey: e.target.value })}
              autoComplete="new-password"
            />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900 max-w-2xl mx-auto">
        <p className="text-purple-900 dark:text-purple-100">
          <strong>Note:</strong> Your API key is only used for this session and is never stored. 
          Make sure you have read access to the organization you want to backup.
        </p>
      </Card>
    </div>
  );
}