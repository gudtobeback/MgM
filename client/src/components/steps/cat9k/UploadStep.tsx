import React, { useRef, useState } from "react";

import { Input } from "antd";
import { Upload, FileText } from "lucide-react";

import AlertCard from "../../ui/AlertCard";

import { parseCat9KConfig } from "../../../services/cat9kParser";

import { Cat9KData } from "../../../types/types";
import OvalButton from "../../home/OvalButton";
import FormField from "../../ui/FormField";
import { CustomTextarea } from "../../ui/CustomTextarea";

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
    <div className="flex flex-col gap-6">
      <div className="flex gap-6">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`sm:min-w-[400px] p-7 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-150
          ${
            dragging
              ? "bg-green-50 border-green-300"
              : "bg-[#F3F4F5] border-gray-300"
          }`}
        >
          {/* Hidden */}
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

          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div
              className={`p-4 ${
                dragging ? "bg-green-100" : "bg-[#003E680D]"
              } rounded-full`}
            >
              <Upload
                size={20}
                className={dragging ? "text-blue-600" : "text-[#003E68]"}
              />
            </div>

            <div className="font-semibold text-sm text-[#003E68]">
              {data.rawConfig
                ? "File loaded — click to replace"
                : "Drop file here or click to browse"}
            </div>

            <div className="text-xs text-[#94A3B8]">
              Supports .txt, .cfg, .conf — or paste configuration
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full">
          {/* Textarea */}
          <FormField
            id="text"
            label="Paste configuration"
            className="text-[13px] uppercase"
          >
            <CustomTextarea
              id="text"
              rows={10}
              style={{ fontFamily: "var(--font-mono)" }}
              placeholder="Paste IOS-XE running-config here..."
              value={data.rawConfig}
              onChange={(e: any) =>
                onUpdate({ rawConfig: e.target.value, parsedConfig: null })
              }
            />
          </FormField>

          {/* Parse button */}
          <OvalButton
            onClick={handleParse}
            className="w-fit"
            disabled={!data.rawConfig.trim()}
          >
            <FileText size={16} />
            Parse configuration
          </OvalButton>
        </div>
      </div>

      {parseError && <AlertCard variant="red">{parseError}</AlertCard>}

      {parsed && (
        <AlertCard variant="green">
          <div className="flex items-center gap-1">
            <p className="font-semibold">Configuration parsed successfully!</p>
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
  );
}
