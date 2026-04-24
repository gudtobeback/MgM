import { useState, useEffect } from 'react';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Search, Wifi, Camera, Router, Loader2 } from 'lucide-react';
// FIX: Use correct relative path for merakiService import.
import { getOrgDevices, getOrgNetworks } from '../../../services/merakiService';

interface BackupDeviceSelectionStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

const typeMap: Record<string, string> = {
  appliance: 'Security Appliance',
  switch: 'Switch',
  wireless: 'Wireless AP',
  camera: 'Camera',
  sensor: 'Sensor',
  cellularGateway: 'Cellular Gateway',
};

const iconMap: Record<string, any> = {
  appliance: Router,
  switch: Router,
  wireless: Wifi,
  camera: Camera,
};


export function BackupDeviceSelectionStep({ data, onUpdate }: BackupDeviceSelectionStepProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceSerials, setSelectedDeviceSerials] = useState<string[]>(data.selectedDevices?.map((d: any) => d.serial) || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const orgId = data.organization.id;
        const apiKey = data.apiKey;
        const region = data.region || 'com';

        const [fetchedNetworks, fetchedDevices] = await Promise.all([
          getOrgNetworks(apiKey, region, orgId, signal),
          getOrgDevices(apiKey, region, orgId, signal)
        ]);

        if (signal.aborted) return;

        const networksMap = fetchedNetworks.reduce((map: any, net: any) => {
          map[net.id] = net.name;
          return map;
        }, {});

        const enhancedDevices = fetchedDevices.map((device: any) => ({
          ...device,
          id: device.serial,
          type: typeMap[device.productType] || device.productType,
          network: networksMap[device.networkId] || 'Unassigned',
          icon: iconMap[device.productType] || Router,
        }));

        setDevices(enhancedDevices);

      } catch (err: any) {
        if (err.name !== 'AbortError') {
            setError('Failed to fetch devices and networks. Please check your API key and try again.');
            console.error(err);
        }
      } finally {
        if (!signal.aborted) {
            setLoading(false);
        }
      }
    };

    if (data.organization?.id && data.apiKey) {
      fetchData();
    }
    
    return () => {
        controller.abort();
    };
  }, [data.organization?.id, data.apiKey, data.region]);


  const filteredDevices = devices.filter(device =>
    device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.network?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    const newSelectedSerials = isChecked ? filteredDevices.map(d => d.serial) : [];
    setSelectedDeviceSerials(newSelectedSerials);
    onUpdate({ selectedDevices: devices.filter(d => newSelectedSerials.includes(d.serial)) });
  };

  const handleSelectDevice = (deviceSerial: string, checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    let newSelectedSerials: string[];
    if (isChecked) {
      newSelectedSerials = [...selectedDeviceSerials, deviceSerial];
    } else {
      newSelectedSerials = selectedDeviceSerials.filter(serial => serial !== deviceSerial);
    }
    setSelectedDeviceSerials(newSelectedSerials);
    onUpdate({ selectedDevices: devices.filter(d => newSelectedSerials.includes(d.serial)) });
  };

  const getDeviceTypeColor = (type: string) => {
    switch (type) {
      case 'Security Appliance': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Switch': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Wireless AP': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Camera': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const allFilteredSelected = filteredDevices.length > 0 && filteredDevices.every(d => selectedDeviceSerials.includes(d.serial));
  const someFilteredSelected = filteredDevices.some(d => selectedDeviceSerials.includes(d.serial));
  const selectAllState = allFilteredSelected ? true : (someFilteredSelected ? 'indeterminate' : false);


  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="mt-4 text-muted-foreground">Loading devices...</p>
        </div>
    );
  }

  if (error) {
    return <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select Devices to Backup</h2>
        <p className="text-muted-foreground mt-2">
          Choose which devices you want to backup from {data.organization?.name || 'the organization'}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <Badge variant="outline">
            Total: {devices.length} devices
          </Badge>
          <Badge variant="default" className="bg-purple-600 dark:bg-purple-600">
            Selected: {selectedDeviceSerials.length} devices
          </Badge>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectAllState}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Network</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.length > 0 ? (
                filteredDevices.map((device) => {
                const Icon = device.icon;
                return (
                    <TableRow key={device.serial}>
                    <TableCell>
                        <Checkbox
                            checked={selectedDeviceSerials.includes(device.serial)}
                            onCheckedChange={(checked) => handleSelectDevice(device.serial, checked)}
                        />
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span>{device.name}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className={getDeviceTypeColor(device.type)}>
                        {device.type}
                        </Badge>
                    </TableCell>
                    <TableCell>{device.model}</TableCell>
                    <TableCell className="font-mono">{device.serial}</TableCell>
                    <TableCell>{device.network}</TableCell>
                    </TableRow>
                );
                })
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No devices found in this organization.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
