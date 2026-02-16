import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Globe, Key } from 'lucide-react';

export const MERAKI_REGIONS = [
  { code: 'com', name: 'Global (Americas)',  dashboard: 'dashboard.meraki.com', confirmed: true },
  { code: 'in',  name: 'India',              dashboard: 'dashboard.meraki.in',  confirmed: true },
  { code: 'cn',  name: 'China',              dashboard: 'dashboard.meraki.cn',  confirmed: false },
  { code: 'ca',  name: 'Canada',             dashboard: 'dashboard.meraki.ca',  confirmed: false },
  { code: 'uk',  name: 'United Kingdom',     dashboard: 'dashboard.meraki.uk',  confirmed: false },
  { code: 'eu',  name: 'Europe',             dashboard: 'dashboard.meraki.eu',  confirmed: false },
  { code: 'au',  name: 'Australia',          dashboard: 'dashboard.meraki.au',  confirmed: false },
  { code: 'custom', name: 'Custom URL',      dashboard: '',                     confirmed: true },
];

interface SourceConnectionStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function SourceConnectionStep({ data, onUpdate }: SourceConnectionStepProps) {
  const selectedRegion = MERAKI_REGIONS.find(r => r.code === data.sourceRegion) ?? MERAKI_REGIONS[0];
  const isCustom = data.sourceRegion === 'custom';

  const handleRegionChange = (code: string) => {
    // Reset org/network when region changes
    onUpdate({ sourceRegion: code, sourceOrg: null, sourceNetwork: null, sourceApiKey: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Connect to Source Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Select the Meraki region and enter your API key for the dashboard you want to migrate <em>from</em>.
        </p>
      </div>

      <Card className="p-6 space-y-5 border-2 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#e8f5eb] flex items-center justify-center flex-shrink-0">
            <Globe className="w-6 h-6 text-[#2563eb]" />
          </div>
          <div>
            <h3>Source Dashboard</h3>
            <p className="text-muted-foreground text-sm">
              {isCustom ? 'Custom API endpoint' : selectedRegion.dashboard}
            </p>
          </div>
        </div>

        {/* Region selector */}
        <div className="space-y-2">
          <Label>Region</Label>
          <Select value={data.sourceRegion || 'com'} onValueChange={handleRegionChange}>
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
        </div>

        {/* Custom URL input */}
        {isCustom && (
          <div className="space-y-2">
            <Label htmlFor="source-custom-url">Custom API Base URL</Label>
            <Input
              id="source-custom-url"
              placeholder="https://api.meraki.example/api/v1"
              value={data.sourceRegion === 'custom' ? (data.sourceCustomApiBase ?? '') : ''}
              onChange={(e) => onUpdate({ sourceCustomApiBase: e.target.value, sourceRegion: e.target.value || 'custom' })}
            />
            <p className="text-xs text-muted-foreground">
              Enter the full API base URL for your Meraki region (e.g. https://api.meraki.cn/api/v1).
            </p>
          </div>
        )}

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="source-api-key">API Key</Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="source-api-key"
              type="password"
              placeholder="Enter source API key"
              className="pl-10"
              value={data.sourceApiKey}
              onChange={(e) => onUpdate({ sourceApiKey: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-[#e8f5eb] border-[#bbdfc4] max-w-2xl mx-auto">
        <p className="text-[#025115] text-sm">
          <strong>Note:</strong> Your API key is only used for this session and is never stored.
          Make sure you have administrator access to the source dashboard.
        </p>
      </Card>

      <Card className="p-4 max-w-2xl mx-auto">
        <h3 className="mb-2 text-sm font-medium">How to get your API key</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Log in to <strong>{isCustom ? 'your Meraki dashboard' : selectedRegion.dashboard}</strong></li>
          <li>Go to <strong>Organization → Settings</strong></li>
          <li>Scroll to <strong>Dashboard API access</strong> and enable it</li>
          <li>Click <strong>Generate new API key</strong>, then paste it above</li>
        </ol>
      </Card>
    </div>
  );
}
