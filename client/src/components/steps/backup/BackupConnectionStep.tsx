import { Input } from "antd";
import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";

interface BackupConnectionStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function BackupConnectionStep({
  data,
  onUpdate,
}: BackupConnectionStepProps) {
  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="font-semibold text-[16px]">Connect to Source Dashboard</p>
        <p className="text-[12px] text-[#232C32]">
          Enter your API key to connect to the dashboard you want to backup
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Title */}
        <div className="flex items-center gap-3 px-4 py-2 bg-[#F6FDFF] rounded-lg border border-[#87D2ED] w-fit">
          <div className="size-7.5 bg-[#049FD9] rounded-full"></div>

          <div className="flex flex-col justify-between">
            <p className="text-sm font-medium">Source Dashboard</p>
            <p className="text-sm text-[#232C32]">dashboard.meraki.com</p>
          </div>
        </div>

        <LabelInput id="api-key" label="API Key" colSpan="col-span-12" required>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your API key"
            value={data.apiKey}
            onChange={(e) => onUpdate({ apiKey: e.target.value })}
            autoComplete="new-password"
          />
        </LabelInput>

        <AlertCard variant="note">
          <p>
            <strong>Note:</strong> Your API key is only used for this session
            and is never stored. Make sure you have read access to the
            organization you want to backup.
          </p>
        </AlertCard>
      </div>
    </div>
  );
}
