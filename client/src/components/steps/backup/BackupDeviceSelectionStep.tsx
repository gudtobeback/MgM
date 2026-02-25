import { useState, useEffect } from "react";
import { Checkbox } from "../../ui/checkbox";

import { Badge } from "../../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Wifi, Camera, Router, Loader2 } from "lucide-react";
// FIX: Use correct relative path for merakiService import.
import { getOrgDevices, getOrgNetworks } from "../../../services/merakiService";
import AlertCard from "../../ui/AlertCard";
import { Input } from "antd";

const { Search } = Input;

interface BackupDeviceSelectionStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

const typeMap: Record<string, string> = {
  appliance: "Security Appliance",
  switch: "Switch",
  wireless: "Wireless AP",
  camera: "Camera",
  sensor: "Sensor",
  cellularGateway: "Cellular Gateway",
};

const iconMap: Record<string, any> = {
  appliance: Router,
  switch: Router,
  wireless: Wifi,
  camera: Camera,
};

export function BackupDeviceSelectionStep({
  data,
  onUpdate,
}: BackupDeviceSelectionStepProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceSerials, setSelectedDeviceSerials] = useState<string[]>(
    data.selectedDevices?.map((d: any) => d.serial) || [],
  );
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
        const region = data.region || "com";

        const [fetchedNetworks, fetchedDevices] = await Promise.all([
          getOrgNetworks(apiKey, region, orgId, signal),
          getOrgDevices(apiKey, region, orgId, signal),
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
          network: networksMap[device.networkId] || "Unassigned",
          icon: iconMap[device.productType] || Router,
        }));

        setDevices(enhancedDevices);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(
            "Failed to fetch devices and networks. Please check your API key and try again.",
          );
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

  const filteredDevices = devices.filter(
    (device) =>
      device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.network?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    const newSelectedSerials = isChecked
      ? filteredDevices.map((d) => d.serial)
      : [];
    setSelectedDeviceSerials(newSelectedSerials);
    onUpdate({
      selectedDevices: devices.filter((d) =>
        newSelectedSerials.includes(d.serial),
      ),
    });
  };

  const handleSelectDevice = (
    deviceSerial: string,
    checked: boolean | "indeterminate",
  ) => {
    const isChecked = checked === true;
    let newSelectedSerials: string[];
    if (isChecked) {
      newSelectedSerials = [...selectedDeviceSerials, deviceSerial];
    } else {
      newSelectedSerials = selectedDeviceSerials.filter(
        (serial) => serial !== deviceSerial,
      );
    }
    setSelectedDeviceSerials(newSelectedSerials);
    onUpdate({
      selectedDevices: devices.filter((d) =>
        newSelectedSerials.includes(d.serial),
      ),
    });
  };

  const getDeviceTypeColor = (type: string) => {
    switch (type) {
      case "Security Appliance":
        return "bg-blue-100 text-white dark:bg-blue-900/30";
      case "Switch":
        return "bg-purple-100 text-white dark:bg-purple-900/30";
      case "Wireless AP":
        return "bg-green-100 text-white dark:bg-green-900/30";
      case "Camera":
        return "bg-orange-100 text-white dark:bg-orange-900/30";
      default:
        return "bg-gray-100 text-white dark:bg-gray-900/30";
    }
  };

  const allFilteredSelected =
    filteredDevices.length > 0 &&
    filteredDevices.every((d) => selectedDeviceSerials.includes(d.serial));
  const someFilteredSelected = filteredDevices.some((d) =>
    selectedDeviceSerials.includes(d.serial),
  );
  const selectAllState = allFilteredSelected
    ? true
    : someFilteredSelected
      ? "indeterminate"
      : false;

  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="font-semibold text-[16px]">Select Devices to Backup</p>
        <p className="text-[12px] text-[#232C32]">
          Choose which devices you want to backup from{" "}
          {data.organization?.name || "the organization"}
        </p>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="mt-4 text-muted-foreground">Loading devices...</p>
          </div>
        ) : error ? (
          <AlertCard variant="error">{error}</AlertCard>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <Search
                className="w-[400px]"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="flex gap-4">
                <Badge variant="outline">Total: {devices.length} devices</Badge>
                <Badge
                  variant="default"
                  className="text-white bg-purple-600 dark:bg-purple-600"
                >
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
                              checked={selectedDeviceSerials.includes(
                                device.serial,
                              )}
                              onCheckedChange={(checked) =>
                                handleSelectDevice(device.serial, checked)
                              }
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
                            <Badge
                              variant="secondary"
                              className={getDeviceTypeColor(device.type)}
                            >
                              {device.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{device.model}</TableCell>
                          <TableCell className="font-mono">
                            {device.serial}
                          </TableCell>
                          <TableCell>{device.network}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No devices found in this organization.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
