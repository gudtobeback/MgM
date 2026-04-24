import React, { useState, useEffect } from "react";
import { apiEndpoints } from "../services/api";

export const useListAllUses = () => {
  const [usersLoading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const res = await apiEndpoints.listUsers();

      const data = res.data;

      setUsers(data);
      console.log("All Users: ", data);
    } catch (error) {
      console.error("Error fetching All Users: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  return {
    users,
    usersLoading,
    fetchAllUsers,
  };
};
