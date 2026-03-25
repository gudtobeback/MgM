import React from "react";

const Section = ({ title, children }) => (
  <div className="bg-white shadow-sm border rounded-xl p-6 mb-6">
    <h2 className="text-lg font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

const Badge = ({ text, type }) => {
  const styles = {
    success: "bg-green-100 text-green-700",
    danger: "bg-red-100 text-red-700",
    warning: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded ${styles[type]}`}>{text}</span>
  );
};

export default function PreMigrationChecklist() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Meraki Migrate — Pre-Migration Checklist
        </h1>

        {/* Licensing */}
        <Section title="1. Licensing — Validate First">
          <p className="text-sm text-gray-600 mb-4">
            Licensing must be resolved before starting the migration.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Source Org</th>
                  <th className="p-2 text-left">Target Org</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-2">Co-Term</td>
                  <td className="p-2">Co-Term</td>
                  <td className="p-2">
                    <Badge text="Supported" type="success" />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-2">Per-Device</td>
                  <td className="p-2">Per-Device (new org)</td>
                  <td className="p-2">
                    <Badge text="Supported" type="success" />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-2">Per-Device</td>
                  <td className="p-2">Co-Term</td>
                  <td className="p-2">
                    <Badge text="Not Possible" type="danger" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700 font-medium">
              ⛔ Per-Device → Co-Term is a hard blocker.
            </p>
            <p className="text-sm text-red-600 mt-1">
              Migration cannot proceed due to platform restrictions.
            </p>
          </div>
        </Section>

        {/* Network */}
        <Section title="2. Network — Run Outside Migrating Network">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
            <p className="text-sm text-yellow-700 font-medium">
              ⚠️ Devices will restart during migration.
            </p>
          </div>

          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>Use a separate network (4G/5G or different office)</li>
            <li>Use a jump server or cloud VM</li>
            <li>Ensure stable connection before starting</li>
          </ul>
        </Section>

        {/* Order */}
        <Section title="3. Correct Order of Operations">
          <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
            <li>Validate licensing model</li>
            <li>Complete license migration</li>
            <li>Confirm licenses are active</li>
            <li>Run tool outside migrating network</li>
            <li>Start migration workflow</li>
          </ol>
        </Section>

        {/* Requirements */}
        <Section title="4. Other Requirements">
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>User must be Org Admin in both orgs</li>
            <li>Enable Meraki Dashboard API</li>
            <li>Target org must be pre-created</li>
            <li>Allow HTTPS (port 443) to api.meraki.com</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
