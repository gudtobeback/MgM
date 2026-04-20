import OvalButton from "@/src/components/home/OvalButton";
import AlertCard from "@/src/components/ui/AlertCard";
import CustomButton from "@/src/components/ui/CustomButton";
import React from "react";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="p-6 bg-white border-[#C1C7D11A] rounded-xl shadow-[0_0_1px_0_rgba(0,0,0,0.25)]">
    <h2 className="text-md text-[#003E68] font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

const Badge = ({
  text,
  type,
}: {
  text: string;
  type: "success" | "danger" | "warning";
}) => {
  const styles = {
    success: "bg-green-100 text-green-700",
    danger: "bg-red-100 text-red-700",
    warning: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded ${styles[type]}`}>{text}</span>
  );
};

export default function PreMigrationChecklist({ agree }: { agree: any }) {
  return (
    <div className="min-h-screen w-full flex flex-col gap-6">
      <p className="mb-4 font-semibold text-2xl text-[#003E68]">
        Pre-Migration Checklist
      </p>

      {/* Licensing */}
      <Section title="1. Licensing — Validate First">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Licensing must be resolved before starting the migration.
          </p>

          <div className="overflow-x-auto rounded-2xl">
            <table
              className="w-full text-xs
            [&_th]:py-3 [&_th]:px-2 [&_th]:font-medium [&_th]:text-[#015C95]
            [&_td]:py-3 [&_td]:px-2 [&_td]:font-medium [&_td]:text-center"
            >
              <thead className="bg-[#F3F4F5]">
                <tr>
                  <th>Source Org</th>
                  <th>Target Org</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Co-Term</td>
                  <td>Co-Term</td>
                  <td>
                    <Badge text="Supported" type="success" />
                  </td>
                </tr>
                <tr>
                  <td>Per-Device</td>
                  <td>Per-Device (new org)</td>
                  <td>
                    <Badge text="Supported" type="success" />
                  </td>
                </tr>
                <tr>
                  <td>Per-Device</td>
                  <td>Co-Term</td>
                  <td>
                    <Badge text="Not Possible" type="danger" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <AlertCard isIcon={false} variant="red">
            <p className="font-medium">
              Per-Device → Co-Term is a hard blocker.
            </p>
            <p>Migration cannot proceed due to platform restrictions.</p>
          </AlertCard>
        </div>
      </Section>

      {/* Network */}
      <Section title="2. Network — Run Outside Migrating Network">
        <div className="flex flex-col gap-4">
          <AlertCard variant="yellow">
            <p className="font-medium">
              Devices will restart during migration.
            </p>
          </AlertCard>

          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>Use a separate network (4G/5G or different office)</li>
            <li>Use a jump server or cloud VM</li>
            <li>Ensure stable connection before starting</li>
          </ul>
        </div>
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

      <div className="w-full flex justify-end">
        <OvalButton onClick={agree} className="self-end">
          Agree & Continue
        </OvalButton>
      </div>
    </div>
  );
}
