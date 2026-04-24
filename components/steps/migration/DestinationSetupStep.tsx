import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card } from '../../ui/card';
import { Alert, AlertDescription } from '../../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { Globe, Key, ExternalLink, Info } from 'lucide-react';
import { MERAKI_REGIONS } from './SourceConnectionStep';

interface DestinationSetupStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function DestinationSetupStep({ data, onUpdate }: DestinationSetupStepProps) {
  const selectedRegion = MERAKI_REGIONS.find(r => r.code === data.destinationRegion) ?? MERAKI_REGIONS[1];
  const isCustom = data.destinationRegion === 'custom';

  const handleRegionChange = (code: string) => {
    // Reset destination org/network when region changes
    onUpdate({ destinationRegion: code, destinationOrg: null, destinationNetwork: null, destinationApiKey: '' });
  };

  const dashboardUrl = isCustom
    ? undefined
    : `https://${selectedRegion.dashboard}`;

  return (
    <div className="space-y-6">
      <div>
        <h2>Setup Destination Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Select the destination Meraki region and enter your API key for the dashboard you want to migrate <em>to</em>.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Before proceeding:</strong> Make sure you have created an organization in the destination dashboard.
          {!isCustom && selectedRegion.dashboard && (
            <> If you haven't, open <strong>{selectedRegion.dashboard}</strong> and create one first.</>
          )}
        </AlertDescription>
      </Alert>

      <Card className="p-6 space-y-5 border-2 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#e8f5eb] flex items-center justify-center flex-shrink-0">
            <Globe className="w-6 h-6 text-[#2563eb]" />
          </div>
          <div>
            <h3>Destination Dashboard</h3>
            <p className="text-muted-foreground text-sm">
              {isCustom ? 'Custom API endpoint' : selectedRegion.dashboard}
            </p>
          </div>
        </div>

        {/* Region selector */}
        <div className="space-y-2">
          <Label>Region</Label>
          <Select value={data.destinationRegion || 'in'} onValueChange={handleRegionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {MERAKI_REGIONS.map(r => (
                <SelectItem key={r.code} value={r.code}>
                  {r.name}
                  {!r.confirmed && r.code !== 'custom' ? ' ⚠' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isCustom && !selectedRegion.confirmed && (
            <p className="text-xs text-amber-600">
              ⚠ This region domain is not officially confirmed. Verify <strong>{selectedRegion.dashboard}</strong> is active before proceeding.
            </p>
          )}
          {!isCustom && dashboardUrl && (
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => window.open(dashboardUrl, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              Open {selectedRegion.dashboard}
            </Button>
          )}
        </div>

        {/* Custom URL input */}
        {isCustom && (
          <div className="space-y-2">
            <Label htmlFor="dest-custom-url">Custom API Base URL</Label>
            <Input
              id="dest-custom-url"
              placeholder="https://api.meraki.example/api/v1"
              value={data.destinationRegion === 'custom' ? (data.destinationCustomApiBase ?? '') : ''}
              onChange={(e) => onUpdate({ destinationCustomApiBase: e.target.value, destinationRegion: e.target.value || 'custom' })}
            />
            <p className="text-xs text-muted-foreground">
              Enter the full API base URL for your Meraki region (e.g. https://api.meraki.cn/api/v1).
            </p>
          </div>
        )}

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="dest-api-key">API Key</Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="dest-api-key"
              type="password"
              placeholder="Enter destination API key"
              className="pl-10"
              value={data.destinationApiKey}
              onChange={(e) => onUpdate({ destinationApiKey: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-[#e8f5eb] border-[#bbdfc4] max-w-2xl mx-auto">
        <p className="text-[#025115] text-sm">
          <strong>Note:</strong> Your API key is only used for this session and is never stored.
          Make sure you have administrator access to create and manage devices in the destination organization.
        </p>
      </Card>
    </div>
  );
}
