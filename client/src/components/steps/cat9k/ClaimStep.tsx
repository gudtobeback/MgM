import React, { useState, useRef } from "react";

import { Input } from "antd";
import { Plus, Trash2, Loader2, Terminal } from "lucide-react";

import { Cat9KData } from "../../../pages/private/migration/Cat9KMigrationWizard";

import AlertCard from "../../ui/AlertCard";
import LabelInput from "../../ui/LabelInput";
import CustomButton from "../../ui/CustomButton";

import {
  claimNetworkDevices,
  getNetworkDevices,
} from "../../../services/merakiService";

interface ClaimStepProps {
  data: Cat9KData;
  onUpdate: (patch: Partial<Cat9KData>) => void;
  onComplete: () => void;
}

type ClaimState = "idle" | "claiming" | "polling" | "done" | "error";

const CLOUD_ID_REGEX = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;

export function ClaimStep({ data, onUpdate, onComplete }: ClaimStepProps) {
  const [cloudIds, setCloudIds] = useState<string[]>(
    data.claimedDevices.length > 0
      ? data.claimedDevices.map((d) => d.cloudId)
      : [""],
  );
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [log, setLog] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (msg: string) => {
    setLog((prev) => {
      const next = [...prev, msg];
      setTimeout(() => {
        if (logRef.current)
          logRef.current.scrollTop = logRef.current.scrollHeight;
      }, 0);
      return next;
    });
  };

  const validIds = cloudIds.filter((id) => CLOUD_ID_REGEX.test(id.trim()));
  const canClaim = validIds.length > 0 && claimState === "idle";

  const handleAddRow = () => setCloudIds((prev) => [...prev, ""]);
  const handleRemoveRow = (i: number) =>
    setCloudIds((prev) => prev.filter((_, idx) => idx !== i));
  const handleChange = (i: number, val: string) => {
    setCloudIds((prev) =>
      prev.map((v, idx) => (idx === i ? val.toUpperCase() : v)),
    );
  };

  const handleClaim = async () => {
    const ids = cloudIds
      .map((id) => id.trim())
      .filter((id) => CLOUD_ID_REGEX.test(id));
    if (ids.length === 0) return;

    setClaimState("claiming");
    setLog([]);
    setErrorMsg("");

    const apiKey = data.destinationApiKey;
    const region = data.destinationRegion;
    const networkId = data.destinationNetwork!.id;

    addLog(
      `Claiming ${ids.length} device(s) to network "${data.destinationNetwork!.name}"…`,
    );
    addLog(`Cloud ID(s): ${ids.join(", ")}`);
    addLog("");

    try {
      await claimNetworkDevices(apiKey, region, networkId, ids);
      addLog(`✅ Claim request accepted by Meraki.`);
      addLog("");
    } catch (err: any) {
      const msg = err.message ?? "Claim failed";
      addLog(`⚠️  Claim failed: ${msg}`);
      setErrorMsg(msg);
      setClaimState("error");
      return;
    }

    setClaimState("polling");
    addLog("Waiting for device(s) to register in Meraki Dashboard…");
    addLog(
      "(This can take up to 5–15 minutes after running `service meraki start` on the switch)",
    );
    addLog("");

    let attempts = 0;
    const MAX_POLLS = 60;

    const poll = async () => {
      attempts++;
      try {
        const devices: any[] =
          (await getNetworkDevices(apiKey, region, networkId)) ?? [];
        const found = ids.filter((id) =>
          devices.some(
            (d) =>
              d.serial?.toLowerCase() === id.toLowerCase() ||
              d.cloudId?.toLowerCase() === id.toLowerCase(),
          ),
        );

        addLog(
          `[Poll ${attempts}/${MAX_POLLS}] ${found.length}/${ids.length} device(s) visible in Dashboard`,
        );

        if (found.length === ids.length) {
          if (pollRef.current) clearInterval(pollRef.current);

          const claimedDevices = ids.map((cloudId) => {
            const dev = devices.find(
              (d) =>
                d.serial?.toLowerCase() === cloudId.toLowerCase() ||
                d.cloudId?.toLowerCase() === cloudId.toLowerCase(),
            );
            return {
              cloudId,
              serial: dev?.serial ?? cloudId,
              name: dev?.name ?? dev?.serial ?? cloudId,
              model: dev?.model ?? "",
            };
          });

          addLog("");
          addLog(
            `✅ All ${ids.length} device(s) are now registered in Meraki Dashboard.`,
          );

          onUpdate({ claimedDevices });
          setClaimState("done");
        } else if (attempts >= MAX_POLLS) {
          if (pollRef.current) clearInterval(pollRef.current);

          onUpdate({
            claimedDevices: ids.map((id) => ({
              cloudId: id,
              serial: id,
              name: id,
              model: "",
            })),
          });
          setClaimState("done");
        }
      } catch {
        addLog(`[Poll ${attempts}] Could not fetch devices — retrying…`);
      }
    };

    await poll();
    pollRef.current = setInterval(poll, 5000);
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <p className="text-[16px] font-semibold">
          Claim Device(s) to Meraki Dashboard
        </p>
        <p className="text-[12px] text-[#232C32]">
          Before pushing configuration, the Catalyst 9K switch must be
          registered with Meraki and claimed to the destination network.
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* CLI Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-md px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Run on your Catalyst 9K switch (IOS-XE CLI)
          </div>

          {[
            {
              label: "Step 1 — Validate compatibility",
              cmd: "show meraki compatibility",
            },
            {
              label: "Step 2 — Register & get Cloud ID",
              cmd: "service meraki register",
            },
            {
              label: "Step 3 — Start Meraki migration",
              cmd: "service meraki start",
            },
          ].map(({ label, cmd }) => (
            <div key={cmd} className="mb-2.5">
              <div className="text-[11px] text-slate-500 mb-1">{label}</div>
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded text-[13px] font-mono text-green-400">
                <Terminal size={12} className="shrink-0 text-green-400" />
                {cmd}
              </div>
            </div>
          ))}
        </div>

        {/* Cloud ID Input */}
        {(claimState === "idle" || claimState === "error") && (
          <>
            <div className="flex flex-col gap-2">
              <LabelInput
                id="cloud-id"
                label="Cloud ID(s) — one per switch / stack member"
                required
              >
                {cloudIds.map((id, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      id="cloud-id"
                      maxLength={14}
                      className={`font-mono tracking-widest ${
                        id && !CLOUD_ID_REGEX.test(id) && "select-warning"
                      }`}
                      placeholder="XXZZ-XXZZ-XXZZ"
                      value={id}
                      onChange={(e) => handleChange(i, e.target.value)}
                    />

                    {cloudIds.length > 1 && (
                      <button
                        onClick={() => handleRemoveRow(i)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </LabelInput>

              <button
                onClick={handleAddRow}
                className="flex items-center gap-1.5 w-fit text-[12px] font-semibold text-blue-600"
              >
                <Plus size={13} /> Add another switch
              </button>

              {claimState === "error" && errorMsg && (
                <AlertCard variant="error">{errorMsg}</AlertCard>
              )}
            </div>

            <CustomButton
              onClick={handleClaim}
              className="w-fit"
              disabled={!canClaim}
            >
              Claim & Wait for Device
            </CustomButton>
          </>
        )}

        {/* Log */}
        {log.length > 0 && (
          <div
            ref={logRef}
            className="h-[220px] overflow-y-auto bg-slate-900 border border-gray-300 rounded-md px-4 py-3 font-mono text-[12px] leading-relaxed text-slate-200 mb-4"
          >
            {log.map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith("✅")
                    ? "text-green-400"
                    : line.startsWith("⚠️")
                      ? "text-yellow-400"
                      : line.startsWith("[Poll")
                        ? "text-slate-400"
                        : ""
                }
              >
                {line || <br />}
              </div>
            ))}

            {(claimState === "claiming" || claimState === "polling") && (
              <div className="flex items-center gap-2 mt-1 text-blue-400">
                <Loader2 size={11} className="animate-spin shrink-0" />
                {claimState === "claiming"
                  ? "Sending claim request…"
                  : "Polling for device…"}
              </div>
            )}
          </div>
        )}

        {/* Done State */}
        {claimState === "done" && (
          <>
            <AlertCard variant="success">
              <div className="font-bold">
                {data.claimedDevices?.length} device(s) claimed successfully
              </div>
              <div>Click Next to push the translated IOS-XE configuration.</div>
            </AlertCard>

            <CustomButton onClick={onComplete}>
              Next — Push Configuration
            </CustomButton>
          </>
        )}
      </div>
    </div>
  );
}
