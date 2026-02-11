import { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Building2, CheckCircle2, Loader2, NetworkIcon } from 'lucide-react';
import { getOrganizations, getOrgNetworks } from '../../../services/merakiService';
import { MerakiOrganization, MerakiNetwork } from '../../../types';

interface SourceOrganizationStepProps {
  data: {
    sourceApiKey: string;
    sourceRegion: string;
    sourceOrg: MerakiOrganization | null;
    sourceNetwork: MerakiNetwork | null;
  };
  onUpdate: (data: any) => void;
}

export function SourceOrganizationStep({ data, onUpdate }: SourceOrganizationStepProps) {
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
        const orgs = await getOrganizations(data.sourceApiKey, data.sourceRegion, signal);
        if (!signal.aborted) {
          setOrganizations(orgs);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError('Failed to fetch source organizations. Please check your source API key and try again.');
          console.error(err);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (data.sourceApiKey) {
      fetchOrgs();
    } else {
      setLoading(false);
      setError("Source API Key not provided. Please go back to the first step.");
    }

    return () => {
      controller.abort();
    };
  }, [data.sourceApiKey]);

  // Fetch networks when an organization is selected
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchNetworks = async () => {
      if (!data.sourceOrg) return;
      setLoadingNetworks(true);
      setNetworks([]);
      try {
        const nets = await getOrgNetworks(data.sourceApiKey, data.sourceRegion, data.sourceOrg.id, signal);
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
  }, [data.sourceOrg, data.sourceApiKey]);

  const handleOrgChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      onUpdate({ sourceOrg: org, sourceNetwork: null }); // Reset network on org change
    }
  };

  const handleNetworkChange = (networkId: string) => {
    const network = networks.find(n => n.id === networkId);
    if (network) {
      onUpdate({ sourceNetwork: network });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#048a24]" />
        <p className="mt-4 text-muted-foreground">Fetching source organizations...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Select Source Organization &amp; Network</h2>
        <p className="text-muted-foreground mt-2">
          Choose the organization and network you want to migrate devices from.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Organization Selector */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#048a24]">
            <Building2 className="w-5 h-5" />
            <Label>Source Organization (dashboard.meraki.com)</Label>
          </div>
          <Select value={data.sourceOrg?.id || ''} onValueChange={handleOrgChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select source organization" />
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
        {data.sourceOrg && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#048a24]">
              <NetworkIcon className="w-5 h-5" />
              <Label>Source Network</Label>
            </div>
            <Select
              value={data.sourceNetwork?.id || ''}
              onValueChange={handleNetworkChange}
              disabled={loadingNetworks || networks.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingNetworks ? "Loading networks..." : "Select source network"} />
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

        {/* Confirmation Card */}
        {data.sourceOrg && data.sourceNetwork && (
          <Card className="p-4 bg-[#e8f5eb] border-[#bbdfc4]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#048a24] mt-0.5" />
              <div className="flex-1">
                <p className="text-[#025115]">
                  <strong>Organization:</strong> {data.sourceOrg.name}
                </p>
                <p className="text-[#025115]">
                  <strong>Network:</strong> {data.sourceNetwork.name}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
