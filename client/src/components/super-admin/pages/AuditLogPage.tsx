import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiClient } from "../../../services/apiClient";
import PageHeader from "../../ui/PageHeader";
import CustomButton from "../../ui/CustomButton";
import { useAuditLogs } from "@/src/hooks/useAuditLogs";

interface AuditEntry {
  id: string;
  action: string;
  details: any;
  ip_address: string | null;
  created_at: string;
  user_email: string | null;
}

export function AuditLogPage() {
  const { auditLogs, auditLogsLoading, fetchAuditLogs } = useAuditLogs();

  const actionColor = (action: string) => {
    if (action.includes("login")) return "#1d4ed8";
    if (action.includes("register")) return "#2563eb";
    if (action.includes("delete") || action.includes("disconnect"))
      return "#dc2626";
    return "var(--color-text-secondary)";
  };

  return (
    <div className="flex flex-col gap-8 p-6">
      <PageHeader
        heading="Audit Log"
        subHeading="Recent system events across all users."
      >
        <CustomButton onClick={fetchAuditLogs} disabled={auditLogsLoading}>
          <RefreshCw
            size={20}
            className={auditLogsLoading ? "animate-spin" : ""}
          />
          Refresh
        </CustomButton>
      </PageHeader>

      <div className="p-5 bg-white rounded-xl shadow-[0_0px_8px_rgba(0,0,0,0.10)] overflow-hidden">
        {auditLogsLoading && auditLogs.length === 0 ? (
          <div className="p-8 text-center text-[14px] text-[var(--color-text-tertiary)]">
            Loading audit log…
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <table
              className="w-full border-collapse
              [&_td]:px-2 [&_td]:py-2 [&_td]:text-[14px] [&_td]:text-center
              [&_th]:px-2 [&_th]:py-2 [&_th]:text-[14px]"
            >
              <thead>
                <tr className="sticky top-0 bg-white">
                  <th>Timestamp</th>

                  <th>User</th>

                  <th>Action</th>

                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center">
                      No audit entries found
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={idx % 2 !== 0 && "bg-gray-100"}
                    >
                      <td>{new Date(entry.created_at).toLocaleString()}</td>

                      <td>{entry.user_email || "system"}</td>

                      <td style={{ color: actionColor(entry.action) }}>
                        {entry.action}
                      </td>

                      <td>
                        {entry.details ? JSON.stringify(entry.details) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-[12px] text-[var(--color-text-tertiary)]">
        Showing {auditLogs?.length} entries
      </div>
    </div>
  );
}
