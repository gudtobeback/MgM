import React, { useState, useEffect } from "react";
import { apiEndpoints } from "../services/api";

export const useAuditLogs = () => {
  const [auditLogsLoading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await apiEndpoints.listAuditLogs(200);

      const data = res.data;

      setAuditLogs(data);
      console.log("Audit Logs: ", data);
    } catch (error) {
      console.error("Error fetching Audit Logs: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return {
    auditLogs,
    auditLogsLoading,
    fetchAuditLogs,
  };
};
