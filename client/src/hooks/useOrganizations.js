import React, { useState, useEffect } from "react";
import { apiEndpoints } from "../services/api";

export default function useOrganizations() {
  const [orgsLoading, setloading] = useState(false);
  const [organizations, setOrganizations] = useState([]);

  const fetchOraganizations = async () => {
    setloading(true);

    try {
      const res = await apiEndpoints.listOrganizations();

      const data = res.data;

      setOrganizations(data);
      console.log("Organizations List: ", data);
    } catch (error) {
      console.error("Failed to fetch Organizations: ", error);
    } finally {
      setloading(false);
    }
  };

  return { orgsLoading, organizations, fetchOraganizations };
}
