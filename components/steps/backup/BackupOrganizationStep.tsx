import { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Building2, CheckCircle2, Loader2 } from 'lucide-react';
// FIX: Use correct relative path for merakiService import.
import { getOrganizations } from '../../../services/merakiService'; 
import { MerakiOrganization } from '../../../types';

interface BackupOrganizationStepProps {
  data: {
    apiKey: string;
    region: 'com' | 'in';
    organization: MerakiOrganization | null;
  };
  onUpdate: (data: { organization?: MerakiOrganization }) => void;
}

export function BackupOrganizationStep({ data, onUpdate }: BackupOrganizationStepProps) {
  const [selectedOrgId, setSelectedOrgId] = useState(data.organization?.id || '');
  const [organizations, setOrganizations] = useState<MerakiOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchOrgs = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = data.apiKey;
        const region = data.region || 'com';
        const orgs = await getOrganizations(apiKey, region, signal);
        if (!signal.aborted) {
            setOrganizations(orgs);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
            setError('Failed to fetch organizations. Please check your API key and try again.');
            console.error(err);
        }
      } finally {
        if (!signal.aborted) {
            setLoading(false);
        }
      }
    };

    if (data.apiKey) {
      fetchOrgs();
    } else {
        setLoading(false);
        setError("API Key not provided. Please go back to the first step.");
    }
    
    return () => {
        controller.abort();
    };

  }, [data.apiKey, data.region]);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      onUpdate({ organization: org });
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="mt-4 text-muted-foreground">Fetching organizations...</p>
        </div>
    );
  }

  if (error) {
    return <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select Organization</h2>
        <p className="text-muted-foreground mt-2">
          Choose the organization you want to backup
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Building2 className="w-5 h-5" />
            <Label>Organization</Label>
          </div>
          
          <Select value={selectedOrgId} onValueChange={handleOrgChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select organization to backup" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedOrgId && data.organization && (
            <Card className="p-4 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-purple-900 dark:text-purple-100">
                    Selected: {data.organization.name}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
