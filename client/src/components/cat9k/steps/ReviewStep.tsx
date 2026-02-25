import React from "react";
import { Cat9KData } from "../Cat9KMigrationWizard";
import { Checkbox } from "antd";

interface ReviewStepProps {
  data: Cat9KData;
  onUpdate: (patch: Partial<Cat9KData>) => void;
}

interface ToggleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (val: boolean) => void;
  label: string;
  subtitle?: string;
}

function Toggle({ checked, disabled, onChange, label, subtitle }: ToggleProps) {
  return (
    <label
      className={`flex items-start gap-2.5 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-[2px]"
      />

      <div className="space-y-1">
        <div className="text-[13px] font-semibold text-foreground">{label}</div>

        {subtitle && (
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
    </label>
  );
}

function PanelHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="px-4 py-2.5 bg-secondary border-b border-border flex items-center justify-between">
      <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
        {title}
      </span>

      <span className="text-[11px] font-semibold px-[7px] py-[1px] bg-background border border-border rounded text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

/* Shared classes */
const TH =
  "px-[14px] py-2 text-[11px] font-semibold text-muted-foreground text-left bg-secondary border-b border-border-subtle";

const TD =
  "px-[14px] py-[9px] text-[12px] text-foreground border-b border-border-subtle";

const CODE =
  "font-mono text-[11px] bg-secondary px-[5px] py-[1px] rounded-[3px] text-muted";

export function ReviewStep({ data, onUpdate }: ReviewStepProps) {
  const parsed = data.parsedConfig;

  if (!parsed) {
    return (
      <div className="text-center py-[60px] text-muted">
        No parsed configuration found. Go back and parse a config first.
      </div>
    );
  }

  const hasRadius = parsed.radiusServers.length > 0;
  const hasAcls = parsed.acls.length > 0;

  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="font-semibold text-[16px]">Review Parsed Configuration</p>
        <p className="text-[12px] text-[#232C32]">
          Review the items extracted from the running-config and select which
          categories to apply to the destination Meraki network.
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Apply toggles */}
        <div className="flex items-center gap-6 p-5 border rounded-md">
          <Toggle
            checked={data.applyPorts}
            onChange={(val) => onUpdate({ applyPorts: val })}
            label="Apply switch port configurations"
            subtitle={`${parsed.interfaces.length} interfaces detected`}
          />

          <Toggle
            checked={data.applyRadius}
            disabled={!hasRadius}
            onChange={(val) => onUpdate({ applyRadius: val })}
            label="Create RADIUS access policy"
            subtitle={
              hasRadius
                ? `${parsed.radiusServers.length} server(s) detected`
                : "No RADIUS servers found"
            }
          />

          <Toggle
            checked={data.applyAcls}
            disabled={!hasAcls}
            onChange={(val) => onUpdate({ applyAcls: val })}
            label="Apply ACL rules"
            subtitle={
              hasAcls
                ? `${parsed.acls.length} ACL(s) detected`
                : "No ACLs found"
            }
          />
        </div>

        {/* VLANs */}
        <div className="border border-border rounded-md overflow-hidden mb-4">
          <PanelHeader title="VLANs" count={parsed.vlans.length} />

          {parsed.vlans.length === 0 ? (
            <div className="px-4 py-[14px] text-[13px] text-muted-foreground">
              None detected
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`${TH} w-[80px]`}>ID</th>
                    <th className={TH}>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.vlans.map((v) => (
                    <tr key={v.id}>
                      <td className={TD}>
                        <span className={CODE}>{v.id}</span>
                      </td>
                      <td className={TD}>{v.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Interfaces */}
        <div className="border border-border rounded-md overflow-hidden mb-4">
          <PanelHeader
            title="Switch Interfaces"
            count={parsed.interfaces.length}
          />

          {parsed.interfaces.length === 0 ? (
            <div className="px-4 py-[14px] text-[13px] text-muted-foreground">
              None detected
            </div>
          ) : (
            <div className="max-h-[240px] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`${TH} w-[100px]`}>Port</th>
                    <th className={`${TH} w-[80px]`}>Mode</th>
                    <th className={`${TH} w-[120px]`}>VLAN(s)</th>
                    <th className={TH}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.interfaces.map((iface) => {
                    const modeClasses =
                      iface.mode === "access"
                        ? "bg-[#f0faf2] text-[#025115] border-[#bbdfc4]"
                        : iface.mode === "trunk"
                          ? "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]"
                          : "bg-secondary text-muted-foreground border-border-subtle";

                    return (
                      <tr key={iface.name}>
                        <td className={TD}>
                          <span className={CODE}>{iface.shortName}</span>
                        </td>

                        <td className={TD}>
                          <span
                            className={`text-[11px] font-semibold px-[6px] py-[1px] rounded-[3px] border ${modeClasses}`}
                          >
                            {iface.mode}
                          </span>
                        </td>

                        <td className="px-[14px] py-[9px] font-mono text-[11px] text-muted border-b border-border-subtle">
                          {iface.mode === "access" && iface.accessVlan != null
                            ? iface.accessVlan
                            : iface.mode === "trunk" && iface.trunkAllowedVlans
                              ? iface.trunkAllowedVlans
                              : "—"}
                        </td>

                        <td className="px-[14px] py-[9px] text-[12px] text-muted border-b border-border-subtle">
                          {iface.description || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RADIUS */}
        {hasRadius && (
          <div className="border border-border rounded-md overflow-hidden mb-4">
            <PanelHeader
              title="RADIUS Servers"
              count={parsed.radiusServers.length}
            />

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={TH}>Name</th>
                  <th className={TH}>IP Address</th>
                  <th className={`${TH} w-[100px]`}>Auth Port</th>
                  <th className={TH}>Secret</th>
                </tr>
              </thead>
              <tbody>
                {parsed.radiusServers.map((srv) => (
                  <tr key={srv.name}>
                    <td className={TD}>
                      <span className={CODE}>{srv.name}</span>
                    </td>
                    <td className="px-[14px] py-[9px] font-mono text-[12px] border-b border-border-subtle">
                      {srv.ip}
                    </td>
                    <td className={TD}>{srv.authPort}</td>
                    <td className="px-[14px] py-[9px] font-mono text-[12px] text-muted-foreground border-b border-border-subtle">
                      {srv.key ? "••••••••" : "not set"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ACLs */}
        {hasAcls && (
          <div className="border border-border rounded-md overflow-hidden mb-4">
            <PanelHeader
              title="Access Control Lists"
              count={parsed.acls.length}
            />

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={TH}>ACL Name</th>
                  <th className={`${TH} w-[100px]`}>Rules</th>
                </tr>
              </thead>
              <tbody>
                {parsed.acls.map((acl) => (
                  <tr key={acl.name}>
                    <td className={TD}>
                      <span className={CODE}>{acl.name}</span>
                    </td>
                    <td className={TD}>{acl.rules.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
