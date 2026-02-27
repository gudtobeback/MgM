import React, { useState, useEffect } from "react";

import { Input, Select } from "antd";
import { Building2, Plus, Trash2, AlertCircle, Globe, X } from "lucide-react";

import LabelInput from "../../components/ui/LabelInput";
import CustomBadge from "../../components/ui/CustomBadge";
import CustomButton from "../../components/ui/CustomButton";

import { apiClient } from "../../services/apiClient";

interface Organization {
  id: string;
  meraki_org_id: string;
  meraki_org_name: string;
  meraki_region: string;
  is_active: boolean;
  last_synced_at: string | null;
  device_count: number;
  created_at: string;
}

interface OrganizationsPageProps {
  onSelectOrg?: (orgId: string, orgName: string) => void;
}

export const OrganizationsPage: React.FC<OrganizationsPageProps> = ({
  onSelectOrg,
}) => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    merakiOrgId: "",
    merakiOrgName: "",
    merakiApiKey: "",
    merakiRegion: "com" as "com" | "in",
  });
  console.log("Payload: ", form);

  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    try {
      setLoading(true);
      const data = await apiClient.listOrganizations();
      setOrgs(data);
    } catch (err) {
      setError("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const changeFormDetails = (field: string, value: any, option?: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleAddOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiClient.createOrganization(form);
      setForm({
        merakiOrgId: "",
        merakiOrgName: "",
        merakiApiKey: "",
        merakiRegion: "com",
      });
      setShowAddForm(false);
      await loadOrgs();
    } catch (err: any) {
      setError(err.message || "Failed to add organization");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveOrg = async (orgId: string, orgName: string) => {
    if (!window.confirm(`Remove "${orgName}" from your dashboard?`)) return;
    try {
      await apiClient.removeOrganization(orgId);
      setOrgs((prev) => prev.filter((o) => o.id !== orgId));
    } catch (err: any) {
      setError(err.message || "Failed to remove organization");
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 w-full">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Organizations</p>
          <p className="text-xs text-black/60">
            Connect your Meraki organizations to unlock monitoring, snapshots,
            and bulk operations.
          </p>
        </div>

        <CustomButton
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 text-sm"
        >
          <Plus size={20} /> Add Organization
        </CustomButton>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Add Organization Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddOrg}
          className="flex flex-col bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)] overflow-hidden"
        >
          <div className="flex items-start justify-between p-6 bg-[#FBFBFB] border-b-2">
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-[18px]">Connect Organization</p>
              <p className="text-sm text-[#232C32]">
                Link a Meraki org using your Dashboard API key
              </p>
            </div>

            <X
              size={28}
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-gray-200 rounded-full transition-all cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-12 gap-6 p-6 bg-[#FBFBFB]">
            <LabelInput
              id="organization-id"
              label="Oragnization ID"
              colSpan="col-span-12 md:col-span-6"
              required
            >
              <Input
                id="organization-id"
                placeholder="e.g. 123456"
                value={form.merakiOrgId}
                onChange={(e: any) =>
                  changeFormDetails("merakiOrgId", e.target.value)
                }
              />
            </LabelInput>

            <LabelInput
              id="organization-name"
              label="Oragnization Name"
              colSpan="col-span-12 md:col-span-6"
              required
            >
              <Input
                id="organization-name"
                placeholder="My Company Network"
                value={form.merakiOrgName}
                onChange={(e: any) =>
                  changeFormDetails("merakiOrgName", e.target.value)
                }
              />
            </LabelInput>

            <LabelInput
              id="api-key"
              label="Meraki API Key"
              colSpan="col-span-12"
              required
            >
              <Input
                id="api-key"
                placeholder="Your Meraki API key"
                value={form.merakiApiKey}
                onChange={(e: any) =>
                  changeFormDetails("merakiApiKey", e.target.value)
                }
              />
            </LabelInput>

            <LabelInput
              id="region"
              label="Region"
              colSpan="col-span-12"
              required
            >
              <Select
                id="region"
                placeholder="Select Region"
                value={form.merakiRegion}
                options={[
                  { value: "com", label: "Global (api.meraki.com)" },
                  { value: "in", label: "India (api.meraki.in)" },
                ]}
                onChange={(value: any) =>
                  changeFormDetails("merakiRegion", value as "com" | "in")
                }
              />
            </LabelInput>
          </div>

          <div className="flex items-center gap-3 p-6 bg-[#E7E7E7]">
            <CustomButton type="submit" disabled={submitting}>
              {submitting ? "Connecting…" : "Connect Organization"}
            </CustomButton>

            <CustomButton
              onClick={() => setShowAddForm(!showAddForm)}
              text_prop="text-black"
              bg_prop="bg-white"
              className="border border-gray-300 shadow-[0_0px_2px_rgba(0,0,0,0.25)] hover:shadow-[0_0px_2px_rgba(0,0,0,0.50)]"
            >
              Cancle
            </CustomButton>
          </div>
        </form>
      )}

      {/* Organizations List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 animate-pulse">
          <Building2 size={30} className="opacity-50" />
          <p>Loading Organizations...</p>
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-100 gap-3 p-5 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
          <Building2 size={24} className="text-muted-foreground" />

          <p className="font-semibold text-md text-foreground">
            No organizations connected
          </p>

          <p className="-m-2 text-xs text-black/60">
            Add your Meraki organization to get started with monitoring and
            snapshots.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {orgs.map((org) => (
            <div
              key={org.id}
              onClick={() =>
                onSelectOrg && onSelectOrg(org.id, org.meraki_org_name)
              }
              className="col-span-12 md:col-span-3 p-5 flex flex-col gap-3 bg-white border-t-[3px] border-black rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.10)] hover:scale-[101%] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#C8C8C8] rounded-full">
                  <Building2 size={20} className="text-[#049FD9]" />
                </div>
                <div className="flex flex-col items-start gap-2">
                  <p className="font-semibold text-[18px]">
                    {org.meraki_org_name}
                  </p>
                  <p className="text-xs text-[#979797]">
                    ID: {org.meraki_org_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CustomBadge
                  icon={<Globe size={12} />}
                  text={org.meraki_region === "in" ? "India" : "Global"}
                  text_prop="text-[#0F73FF] text-xs"
                  bg_prop="bg-[#E7F1FF]"
                />

                {org.device_count > 0 && (
                  <CustomBadge
                    text={`${org.device_count} Devices`}
                    text_prop="text-[#6E1FF6] text-xs"
                    bg_prop="bg-[#ECE2FF]"
                  />
                )}
              </div>

              <div className="border"></div>

              <div className="flex items-center justify-between">
                {org.last_synced_at && (
                  <p className="text-xs text-[#979797]">
                    Last synced{" "}
                    {new Date(org.last_synced_at).toLocaleDateString()}
                  </p>
                )}

                <Trash2
                  size={26}
                  onClick={() => handleRemoveOrg(org.id, org.meraki_org_name)}
                  className="p-1 text-[#979797] hover:text-red-500 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
