import React, { useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { parseCat9KConfig } from "../../../services/cat9kParser";
import { Cat9KData } from "../../../pages/private/migration/Cat9KMigrationWizard";
import CustomButton from "../../ui/CustomButton";
import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";
import { Input } from "antd";

const { TextArea } = Input;

interface UploadStepProps {
  data: Cat9KData;
  onUpdate: (patch: Partial<Cat9KData>) => void;
}

export function UploadStep({ data, onUpdate }: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parseError, setParseError] = useState("");

  const handleFileContent = (text: string, filename?: string) => {
    onUpdate({ rawConfig: text, parsedConfig: null });
    setParseError("");
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      handleFileContent(e.target?.result as string, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleParse = () => {
    if (!data.rawConfig.trim()) {
      setParseError("Please upload a file or paste a configuration first.");
      return;
    }
    try {
      const parsed = parseCat9KConfig(data.rawConfig);
      onUpdate({ parsedConfig: parsed });
      setParseError("");
    } catch (err) {
      setParseError(
        "Failed to parse configuration. Please check the input format.",
      );
    }
  };

  const parsed = data.parsedConfig;

  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="font-semibold text-[16px]">
          Upload IOS-XE Running Configuration
        </p>
        <p className="text-[12px] text-[#232C32]">
          Upload a <code>.txt</code> or <code>.cfg</code> file from your Cisco
          Catalyst 9000 switch, or paste the running-config directly. The parser
          will extract VLANs, switch port configurations, RADIUS servers, and
          ACLs.
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-4 p-7 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-150 ${
            dragging
              ? "border-blue-600 bg-green-50"
              : "border-border bg-secondary"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.cfg,.conf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
                dragging
                  ? "bg-green-100 border-border"
                  : "bg-background border-border"
              }`}
            >
              <Upload
                size={18}
                className={dragging ? "text-blue-600" : "text-muted-foreground"}
              />
            </div>

            <div className="text-[13px] font-semibold text-foreground">
              {data.rawConfig
                ? "File loaded — click to replace"
                : "Drop file here or click to browse"}
            </div>

            <div className="text-xs text-muted-foreground">
              Accepts .txt, .cfg, .conf — or paste below
            </div>
          </div>
        </div>

        {/* Textarea */}
        <LabelInput id="text" label="Paste configuration">
          <TextArea
            id="text"
            rows={10}
            style={{ fontFamily: "var(--font-mono)" }}
            placeholder="Paste IOS-XE running-config here..."
            value={data.rawConfig}
            onChange={(e) =>
              onUpdate({ rawConfig: e.target.value, parsedConfig: null })
            }
          />
        </LabelInput>

        {/* Parse button */}
        <CustomButton
          onClick={handleParse}
          className="w-fit"
          disabled={!data.rawConfig.trim()}
        >
          <FileText size={16} />
          Parse configuration
        </CustomButton>

        {parseError && <AlertCard variant="error">{parseError}</AlertCard>}

        {parsed && (
          <AlertCard variant="success">
            <div className="flex items-center gap-1">
              <p className="font-semibold">
                Configuration parsed successfully!
              </p>
              {parsed?.hostname && <span> - {parsed?.hostname}</span>}
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: "VLANs", count: parsed.vlans.length },
                { label: "Interfaces", count: parsed.interfaces.length },
                { label: "ACLs", count: parsed.acls.length },
                {
                  label: "RADIUS servers",
                  count: parsed.radiusServers.length,
                },
              ].map((item) => (
                <span
                  key={item.label}
                  className="px-2 py-1 font-semibold text-xs bg-[#e8f5eb] border border-[#bbdfc4] rounded-[4px]"
                >
                  {item.count} {item.label}
                </span>
              ))}
            </div>
          </AlertCard>
        )}
      </div>
    </div>
  );
}
