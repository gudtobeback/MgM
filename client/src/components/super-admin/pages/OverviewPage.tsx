import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, Database } from "lucide-react";
import { apiClient } from "../../../services/apiClient";
import { TOOL_MODE_ROUTES } from "../../../types/routes";
import SummaryCard from "../../ui/SummaryCard";

import PageHeader from "../../ui/PageHeader";
import { useListAllUses } from "@/src/hooks/useListAllUses";
import { useAuditLogs } from "@/src/hooks/useAuditLogs";

export function OverviewPage() {
  const { users, usersLoading } = useListAllUses();

  const { auditLogs, auditLogsLoading } = useAuditLogs();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    companies: 0,
    users: 0,
    audits: 0,
    organizations: 0,
  });

  const loadcompanies = async () => {
    try {
      const companies = await apiClient.listAdminCompanies();

      setStats((prev) => ({
        ...prev,
        companies: companies.length,
      }));
    } catch (error) {
      console.error("Overview load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadcompanies();
  }, []);

  useEffect(() => {
    setStats((prev) => ({
      ...prev,
      users: users.length,
      audits: auditLogs.length,
    }));
  }, [users, auditLogs]);

  const statCards = [
    {
      label: "Companies",
      value: stats?.companies,
      icon: <Building2 size={20} />,
      icon_bg_color: "bg-[#D398E7]",
      page: "admin-companies",
    },
    {
      label: "Total Users",
      value: stats?.users,
      icon: <Users size={20} />,
      icon_bg_color: "bg-[#E89271]",
      page: "admin-users",
    },
    {
      label: "Audit Events",
      value: stats?.audits,
      icon: <Database size={20} />,
      icon_bg_color: "bg-[#70A1E5]",
      page: "admin-audit",
    },
  ];

  const handleNavigate = (page: string) => {
    navigate(TOOL_MODE_ROUTES[page as keyof typeof TOOL_MODE_ROUTES]);
  };

  return (
    <div className="flex flex-col gap-8 p-6">
      <PageHeader
        heading="MSP Overview"
        subHeading="Manage all companies, users, and system activity from this portal."
      />

      {usersLoading || auditLogsLoading ? (
        <div className="text-[14px] text-[var(--color-text-tertiary)]">
          Loading…
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              onClick={() => handleNavigate(card.page)}
              className="cursor-pointer"
            >
              <SummaryCard
                icon={card?.icon}
                icon_bg_color={card?.icon_bg_color}
                value={card?.value}
                label={card?.label}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
