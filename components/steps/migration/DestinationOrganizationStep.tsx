import { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Building2, CheckCircle2, Loader2, NetworkIcon } from 'lucide-react';
// FIX: Use correct relative path for merakiService import.
import { getOrganizations, getOrgNetworks } from '../../../services/merakiService';
import { MerakiOrganization, MerakiNetwork } from '../../../types';

interface DestinationOrganizationStepProps {
  data: {
    destinationApiKey: string;
    destinationRegion: string;
    destinationOrg: MerakiOrganization | null;
    destinationNetwork: MerakiNetwork | null;
  };
  onUpdate: (data: any) => void;
}

export function DestinationOrganizationStep({ data, onUpdate }: DestinationOrganizationStepProps) {
  const [organizations, setOrganizations] = useState<MerakiOrganization[]>([]);
  const [networks, setNetworks] = useState<MerakiNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNetworks, setLoadingNetworks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch organizations when API key is available
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchOrgs = async () => {
      setLoading(true);
      setError(null);
      try {
        const orgs = await getOrganizations(data.destinationApiKey, data.destinationRegion, signal);
        if (!signal.aborted) {
          setOrganizations(orgs);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError('Failed to fetch destination organizations. Please check your destination API key.');
          console.error(err);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (data.destinationApiKey) {
      fetchOrgs();
    } else {
      setLoading(false);
      setError("Destination API Key not provided. Please go back to the previous step.");
    }
    
    return () => {
      controller.abort();
    };
  }, [data.destinationApiKey]);

  // Fetch networks when an organization is selected
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchNetworks = async () => {
      if (!data.destinationOrg) return;
      setLoadingNetworks(true);
      setNetworks([]); // Clear previous networks
      try {
        const nets = await getOrgNetworks(data.destinationApiKey, data.destinationRegion, data.destinationOrg.id, signal);
        if (!signal.aborted) {
          setNetworks(nets);
        }
      } catch (err: any) {
         if (err.name !== 'AbortError') {
          setError('Failed to fetch networks for the selected organization.');
          console.error(err);
        }
      } finally {
        if (!signal.aborted) {
            setLoadingNetworks(false);
        }
      }
    };

    fetchNetworks();
     return () => {
      controller.abort();
    };

  }, [data.destinationOrg, data.destinationApiKey]);

  const handleOrgChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      onUpdate({ destinationOrg: org, destinationNetwork: null }); // Reset network on org change
    }
  };

  const handleNetworkChange = (networkId: string) => {
    const network = networks.find(n => n.id === networkId);
    if (network) {
      onUpdate({ destinationNetwork: network });
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <p className="mt-4 text-muted-foreground">Fetching destination organizations...</p>
        </div>
    );
  }

  if (error) {
    return <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Select Destination Organization & Network</h2>
        <p className="text-muted-foreground mt-2">
          Choose where the devices will be migrated to.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Organization Selector */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Building2 className="w-5 h-5" />
            <Label>Destination Organization (dashboard.meraki.in)</Label>
          </div>
          <Select value={data.destinationOrg?.id || ''} onValueChange={handleOrgChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select destination organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Network Selector */}
        {data.destinationOrg && (
             <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <NetworkIcon className="w-5 h-5" />
                    <Label>Destination Network</Label>
                </div>
                 <Select value={data.destinationNetwork?.id || ''} onValueChange={handleNetworkChange} disabled={loadingNetworks || networks.length === 0}>
                    <SelectTrigger>
                    <SelectValue placeholder={loadingNetworks ? "Loading networks..." : "Select destination network"} />
                    </SelectTrigger>
                    <SelectContent>
                    {networks.map((net) => (
                        <SelectItem key={net.id} value={net.id}>
                        {net.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
             </div>
        )}

        {data.destinationOrg && data.destinationNetwork && (
            <Card className="p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-900 dark:text-green-100">
                    <strong>Organization:</strong> {data.destinationOrg.name}
                  </p>
                   <p className="text-green-900 dark:text-green-100">
                    <strong>Network:</strong> {data.destinationNetwork.name}
                  </p>
                </div>
              </div>
            </Card>
          )}

      </div>
    </div>
  );
}
