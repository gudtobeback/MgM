import React, { useEffect, useState, useMemo } from "react";

import { Input, Select } from "antd";
import { Trash2 } from "lucide-react";

import PageHeader from "../../ui/PageHeader";

import { apiClient } from "../../../services/apiClient";
import { useListAllUses } from "@/src/hooks/useListAllUses";

const { Search } = Input;

export function AllUsersPage() {
  const [search, setSearch] = useState("");

  const { users, usersLoading, fetchAllUsers } = useListAllUses();

  const handleUpdateRole = async (userId: number, role: string) => {
    try {
      await apiClient.updateAdminUser(userId, { role });

      fetchAllUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await apiClient.deleteAdminUser(userId);

      fetchAllUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  };

  const filtered = useMemo(() => {
    return users.filter(
      (u) =>
        (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.company_name || "").toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, users]);

  return (
    <div className="flex flex-col gap-8 p-6">
      <PageHeader
        heading="All Users"
        subHeading="View and manage all users across all companies."
      />

      <div className="flex flex-col gap-5">
        {/* Search */}
        <div className="max-w-[360px]">
          <Search
            placeholder="Search by email, name, or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="p-5 bg-white rounded-xl shadow-[0_0px_8px_rgba(0,0,0,0.10)]">
          {usersLoading ? (
            <div className="p-8 text-center text-[14px] text-[var(--color-text-tertiary)]">
              Loading users…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full border-collapse
                [&_td]:px-2 [&_td]:py-2 [&_td]:text-[14px] [&_td]:text-center
                [&_th]:px-2 [&_th]:py-2 [&_th]:text-[14px]"
              >
                <thead>
                  <tr>
                    <th>Email</th>

                    <th>Name</th>

                    <th>Role</th>

                    <th>Company</th>

                    <th>Tier</th>

                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center">
                        {search
                          ? "No users match your search"
                          : "No users found"}
                      </td>
                    </tr>
                  ) : (
                    filtered?.map((u, idx) => (
                      <tr key={u.id} className={idx % 2 !== 0 && "bg-gray-100"}>
                        <td>{u.email}</td>

                        <td>{u.full_name || "—"}</td>

                        <td>
                          <Select
                            className="w-full text-start"
                            placeholder="Select User Role"
                            value={u.role}
                            options={[
                              { value: "user", label: "User" },
                              {
                                value: "company_admin",
                                label: "Company Admin",
                              },
                              { value: "super_admin", label: "Super Admin" },
                            ]}
                            onChange={(value) => handleUpdateRole(u.id, value)}
                          />
                        </td>

                        <td>{u.company_name || "—"}</td>

                        <td>{u.subscription_tier}</td>

                        <td>
                          <button
                            title="Delete user"
                            onClick={() => handleDelete(u.id)}
                            className="bg-none border-none cursor-pointer text-[#dc2626] flex items-center"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-[12px]">
          {filtered.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}
