import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight, Trash2 } from "lucide-react";
import { apiClient } from "../../../services/apiClient";
import { useSuperAdminLayout } from "../../layout/SuperAdminLayout";
import CustomButton from "../../ui/CustomButton";
import PageHeader from "../../ui/PageHeader";

interface Company {
  id: number;
  name: string;
  user_count: number;
  created_at: string;
}

export function CompaniesPage() {
  const { setSelectedCompanyId } = useSuperAdminLayout();

  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await apiClient.listAdminCompanies();
      setCompanies(data);
    } catch (err) {
      console.error("Load companies error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      await apiClient.createAdminCompany(newName.trim());
      setNewName("");
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to create company");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm(
        "Delete this company? All associated users will lose their company assignment.",
      )
    )
      return;
    try {
      await apiClient.deleteAdminCompany(id);
      await load();
    } catch (err: any) {
      alert(err.message || "Failed to delete company");
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6">
      <PageHeader
        heading="Companies"
        subHeading="Manage customer companies and their users."
      >
        <CustomButton onClick={() => setShowForm(!showForm)}>
          <Plus size={20} /> Add Company
        </CustomButton>
      </PageHeader>

      {showForm && (
        <div className="flex gap-3 items-start flex-wrap p-5 bg-white rounded-xl shadow-[0_0px_8px_rgba(0,0,0,0.10)]">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[12px] font-semibold text-[var(--color-text-secondary)] mb-1.5">
              COMPANY NAME
            </label>

            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Acme Corp"
              className="w-full px-3 py-2 text-[13px] border border-[var(--color-border-primary)] rounded-[5px] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] outline-none box-border"
            />

            {error && (
              <div className="text-[12px] text-[#dc2626] mt-1">{error}</div>
            )}
          </div>

          <div className="flex gap-2 pt-[22px]">
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className={`px-4 py-2 bg-[#2563eb] text-white rounded-[5px] text-[13px] font-semibold ${
                creating ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {creating ? "Creating…" : "Create"}
            </button>

            <button
              onClick={() => {
                setShowForm(false);
                setNewName("");
                setError("");
              }}
              className="px-[14px] py-2 bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)] rounded-[5px] text-[13px] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="p-5 bg-white rounded-xl shadow-[0_0px_8px_rgba(0,0,0,0.10)]">
        {loading ? (
          <div className="p-8 text-center text-[14px] text-[var(--color-text-tertiary)]">
            Loading companies…
          </div>
        ) : (
          <table
            className="w-full border-collapse
            [&_td]:px-2 [&_td]:py-2 [&_td]:text-[14px] [&_td]:text-center
            [&_th]:px-2 [&_th]:py-2 [&_th]:text-[14px]"
          >
            <thead>
              <tr>
                <th>Company Name</th>

                <th>Users</th>

                <th>Created</th>

                <th></th>
              </tr>
            </thead>

            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center">
                    No companies found
                  </td>
                </tr>
              ) : (
                companies.map((c, idx) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/admin/companies/${c.id}`)}
                    className={`${idx % 2 !== 0 && "bg-gray-100"} cursor-pointer`}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{c.name}</span>

                        {c.id === 1 && (
                          <span className="text-[10px] px-[6px] py-[1px] bg-[#e8f5eb] text-[#025115] rounded-[3px] border border-[#bbdfc4]">
                            Default
                          </span>
                        )}
                      </div>
                    </td>

                    <td>{c.user_count}</td>

                    <td>{new Date(c.created_at).toLocaleDateString()}</td>

                    <td>
                      <div className="flex gap-1 justify-end">
                        {c.id !== 1 && (
                          <button
                            onClick={(e) => handleDelete(c.id, e)}
                            className="px-2 py-1 bg-transparent border border-[var(--color-border-subtle)] rounded cursor-pointer text-[#dc2626] flex items-center"
                            title="Delete company"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompanyId(c.id);
                          }}
                          className="px-2 py-1 bg-transparent border border-[var(--color-border-subtle)] rounded cursor-pointer text-[var(--color-text-secondary)] flex items-center"
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
