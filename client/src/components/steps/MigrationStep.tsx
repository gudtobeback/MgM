import React, { useState, useEffect, useRef } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  Undo2,
} from "lucide-react";
import {
  removeDeviceFromNetwork,
  claimDevicesToInventory,
  unclaimDevicesFromInventory,
  addDevicesToNetwork,
  getNetworkDevices,
} from "../../services/merakiService";
import { MigrationData } from "../MigrationWizard";
import { MerakiDeviceDetails } from "../../types/types";
import CustomButton from "../ui/CustomButton";
import AlertCard from "../ui/AlertCard";

// Tracks how far migration progressed — used to skip completed stages on retry
// and to know how far to unwind on rollback.
const STAGE = {
  NONE: 0,
  REMOVED_FROM_SOURCE_NETWORK: 1,
  UNCLAIMED_FROM_SOURCE: 2,
  CLAIMED_TO_DEST: 3,
  ADDED_TO_DEST_NETWORK: 4,
};

interface MigrationStepProps {
  data: MigrationData;
  onUpdate: (data: Partial<MigrationData>) => void;
  onComplete: () => void;
}

export function MigrationStep({
  data,
  onUpdate,
  onComplete,
}: MigrationStepProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackDone, setRollbackDone] = useState(false);

  const hasRun = useRef(false);
  const stageReached = useRef(STAGE.NONE);

  const log = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const wait = (seconds: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));

  const startMigration = async () => {
    if (hasRun.current && !showRetry) return;
    hasRun.current = true;
    setIsMigrating(true);
    setShowRetry(false);
    setError(null);

    const {
      sourceApiKey,
      sourceRegion,
      destinationApiKey,
      destinationRegion,
      sourceOrg,
      destinationOrg,
      destinationNetwork,
      devicesToMigrate,
    } = data;

    const handleFailure = (msg: string) => {
      log(`--- ❌ ${msg} ---`);
      setError(msg);
      setIsMigrating(false);
      setShowRetry(true);
    };

    if (
      !sourceOrg ||
      !destinationOrg ||
      !destinationNetwork ||
      devicesToMigrate.length === 0
    ) {
      handleFailure("Critical data missing. Cannot start migration.");
      return;
    }

    const serialsToMigrate = devicesToMigrate.map((d) => d.serial);
    const success: MerakiDeviceDetails[] = [];

    if (stageReached.current === STAGE.NONE) {
      log("--- Starting Device Migration ---\n");
    } else {
      log(
        `--- Resuming Migration from Stage ${stageReached.current + 1} ---\n`,
      );
    }

    // ── Stage 1: Remove devices from source networks ──────────────────────
    if (stageReached.current < STAGE.REMOVED_FROM_SOURCE_NETWORK) {
      log(
        `Stage 1 of 4 — Removing ${devicesToMigrate.length} device(s) from source networks...`,
      );
      const removals = devicesToMigrate.map((device) => {
        if (!device.networkId) {
          log(
            `  ⏩ ${device.name} (${device.serial}) not in a network — skipping removal.`,
          );
          return Promise.resolve();
        }
        log(`  Removing ${device.name} (${device.serial})...`);
        return removeDeviceFromNetwork(
          sourceApiKey,
          sourceRegion,
          device.networkId,
          device.serial,
        )
          .then(() => log(`    ✅ Removed.`))
          .catch(() =>
            log(
              `    ⚠️ Could not remove from source network — may already be unassigned. Continuing.`,
            ),
          );
      });
      await Promise.all(removals);
      stageReached.current = STAGE.REMOVED_FROM_SOURCE_NETWORK;
      log("  All devices processed for source network removal.\n");
    } else {
      log("  ⏩ Stage 1 already completed — skipping.\n");
    }

    // ── Stage 2: Unclaim from source inventory ────────────────────────────
    if (stageReached.current < STAGE.UNCLAIMED_FROM_SOURCE) {
      log(
        `Stage 2 of 4 — Unclaiming ${serialsToMigrate.length} device(s) from source org "${sourceOrg.name}"...`,
      );
      try {
        await unclaimDevicesFromInventory(
          sourceApiKey,
          sourceRegion,
          sourceOrg.id,
          serialsToMigrate,
        );
        stageReached.current = STAGE.UNCLAIMED_FROM_SOURCE;
        log("  ✅ Devices unclaimed from source inventory.\n");
      } catch (e: any) {
        handleFailure(e.message);
        return;
      }
    } else {
      log("  ⏩ Stage 2 already completed — skipping.\n");
    }

    log(
      "⏳ Waiting 10 seconds for Meraki cloud to release devices from source...",
    );
    await wait(10);

    // ── Stage 3: Claim to destination inventory ───────────────────────────
    if (stageReached.current < STAGE.CLAIMED_TO_DEST) {
      log(
        `\nStage 3 of 4 — Claiming ${serialsToMigrate.length} device(s) to destination org "${destinationOrg.name}"...`,
      );
      try {
        await claimDevicesToInventory(
          destinationApiKey,
          destinationRegion,
          destinationOrg.id,
          serialsToMigrate,
        );
        stageReached.current = STAGE.CLAIMED_TO_DEST;
        log("  ✅ Devices claimed to destination inventory.\n");
      } catch (e: any) {
        handleFailure(e.message);
        return;
      }
    } else {
      log("  ⏩ Stage 3 already completed — skipping.\n");
    }

    log(
      "⏳ Waiting 10 seconds for destination inventory to register devices...",
    );
    await wait(10);

    // ── Stage 4: Add to destination network ──────────────────────────────
    if (stageReached.current < STAGE.ADDED_TO_DEST_NETWORK) {
      log(
        `\nStage 4 of 4 — Adding ${serialsToMigrate.length} device(s) to destination network "${destinationNetwork.name}"...`,
      );
      try {
        await addDevicesToNetwork(
          destinationApiKey,
          destinationRegion,
          destinationNetwork.id,
          serialsToMigrate,
        );
        stageReached.current = STAGE.ADDED_TO_DEST_NETWORK;
        success.push(...devicesToMigrate);
        log("  ✅ All devices added to destination network.\n");
      } catch (e: any) {
        // "Devices already claimed" means the devices are already in a network within the
        // destination org. This happens on retries when Stage 4 previously completed partially,
        // or when Meraki still associates the device with a network from the previous org.
        // Verify whether all devices are already in the target network — if so, treat as success.
        if (e.message?.includes("already claimed")) {
          log(
            "  ⚠️  Meraki says devices already claimed — verifying if they are already in the destination network...",
          );
          try {
            const existingDevices = await getNetworkDevices(
              destinationApiKey,
              destinationRegion,
              destinationNetwork.id,
            );
            const existingSerials = new Set(
              existingDevices.map((d: any) => d.serial),
            );
            const alreadyThere = serialsToMigrate.filter((s) =>
              existingSerials.has(s),
            );
            const missing = serialsToMigrate.filter(
              (s) => !existingSerials.has(s),
            );

            if (missing.length === 0) {
              log(
                `  ✅ All ${serialsToMigrate.length} device(s) are already in the destination network — treating as success.\n`,
              );
              stageReached.current = STAGE.ADDED_TO_DEST_NETWORK;
              success.push(...devicesToMigrate);
            } else {
              log(
                `  ℹ️  ${alreadyThere.length} device(s) already in network, ${missing.length} device(s) missing: ${missing.join(", ")}`,
              );
              handleFailure(
                `Meraki API Error: Devices already claimed — and ${missing.length} device(s) could not be added. They may be in another network within the destination org. Remove them from that network in the Meraki dashboard, then retry.`,
              );
              return;
            }
          } catch (verifyErr: any) {
            // Could not verify — surface the original error
            handleFailure(e.message);
            return;
          }
        } else {
          handleFailure(e.message);
          return;
        }
      }
    } else {
      log("  ⏩ Stage 4 already completed — skipping.\n");
    }

    log(
      "⏳ Waiting 10 seconds for network assignment to propagate before pushing config...",
    );
    await wait(10);

    onUpdate({ migrationSuccess: success, migrationErrors: [] });
    setIsComplete(true);
    setIsMigrating(false);
    log(
      "\n--- ✅ Migration phase complete! Proceeding to configuration restore... ---",
    );
    setTimeout(() => onComplete(), 2000);
  };

  const handleRollback = async () => {
    setIsRollingBack(true);
    setShowRetry(false);
    setError(null);

    const {
      sourceApiKey,
      sourceRegion,
      destinationApiKey,
      destinationRegion,
      sourceOrg,
      sourceNetwork,
      destinationOrg,
      destinationNetwork,
      devicesToMigrate,
    } = data;

    const serials = devicesToMigrate.map((d) => d.serial);

    log(
      "\n--- 🔄 Starting Rollback — undoing completed stages in reverse ---\n",
    );

    // ── Rollback Stage 4: Remove from destination network ─────────────────
    if (stageReached.current >= STAGE.ADDED_TO_DEST_NETWORK) {
      log("Rollback 1/4 — Removing devices from destination network...");
      for (const serial of serials) {
        try {
          await removeDeviceFromNetwork(
            destinationApiKey,
            destinationRegion,
            destinationNetwork!.id,
            serial,
          );
          log(`  ✅ Removed ${serial} from destination network.`);
        } catch (e: any) {
          log(`  ⚠️ Could not remove ${serial}: ${e.message}`);
        }
      }
      log("⏳ Waiting 10 seconds...");
      await wait(10);
    }

    // ── Rollback Stage 3: Unclaim from destination ────────────────────────
    if (stageReached.current >= STAGE.CLAIMED_TO_DEST) {
      log(
        "\nRollback 2/4 — Unclaiming devices from destination organization...",
      );
      try {
        await unclaimDevicesFromInventory(
          destinationApiKey,
          destinationRegion,
          destinationOrg!.id,
          serials,
        );
        log("  ✅ Devices unclaimed from destination organization.");
      } catch (e: any) {
        log(`  ⚠️ Could not unclaim from destination: ${e.message}`);
      }
      log("⏳ Waiting 10 seconds...");
      await wait(10);
    }

    // ── Rollback Stage 2: Re-claim to source ──────────────────────────────
    if (stageReached.current >= STAGE.UNCLAIMED_FROM_SOURCE) {
      log("\nRollback 3/4 — Re-claiming devices to source organization...");
      try {
        await claimDevicesToInventory(
          sourceApiKey,
          sourceRegion,
          sourceOrg!.id,
          serials,
        );
        log("  ✅ Devices re-claimed to source organization.");
      } catch (e: any) {
        log(`  ⚠️ Could not re-claim to source: ${e.message}`);
      }
      log("⏳ Waiting 10 seconds...");
      await wait(10);
    }

    // ── Rollback Stage 1: Re-add to source network ────────────────────────
    if (
      stageReached.current >= STAGE.REMOVED_FROM_SOURCE_NETWORK &&
      sourceNetwork
    ) {
      log(
        `\nRollback 4/4 — Re-adding devices to source network "${sourceNetwork.name}"...`,
      );
      try {
        await addDevicesToNetwork(
          sourceApiKey,
          sourceRegion,
          sourceNetwork.id,
          serials,
        );
        log("  ✅ Devices re-added to source network.");
      } catch (e: any) {
        log(`  ⚠️ Could not re-add to source network: ${e.message}`);
      }
    }

    stageReached.current = STAGE.NONE;
    setIsRollingBack(false);
    setRollbackDone(true);
    log(
      "\n--- ✅ Rollback complete. Devices should be restored to the source dashboard. ---",
    );
    log("You can now restart the wizard or fix any issues before retrying.");
  };

  const handleRetry = () => {
    // Keep stageReached intact so we resume from where we left off
    setLogs([]);
    setError(null);
    hasRun.current = false;
    setShowRetry(false);
    startMigration();
  };

  const handleSkip = () => {
    log(
      "⏩ User skipped migration step. Assuming devices were manually moved. Proceeding to restore...",
    );
    onUpdate({ migrationSuccess: data.devicesToMigrate, migrationErrors: [] });
    onComplete();
  };

  useEffect(() => {
    startMigration();
  }, []);

  const stageLabel = [
    "",
    "Stage 1 — Remove from source network",
    "Stage 2 — Unclaim from source",
    "Stage 3 — Claim to destination",
    "Stage 4 — Add to destination network",
  ];
  const failedStageText =
    stageReached.current < 4 ? stageLabel[stageReached.current + 1] : "";

  return (
    <div className="flex flex-col bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-1 p-6 border-b-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[16px]">
            {isComplete
              ? "Migration Phase Complete"
              : isRollingBack
                ? "Rolling Back..."
                : rollbackDone
                  ? "Rollback Complete"
                  : error
                    ? "Migration Failed"
                    : "Migrating Devices"}
          </p>

          {isComplete && <CheckCircle2 size={24} className="text-green-500" />}
          {(error || rollbackDone) && !isComplete && (
            <XCircle size={24} className="text-red-500" />
          )}
          {(isMigrating || isRollingBack) && (
            <Loader2 size={24} className="animate-spin text-[#2563eb]" />
          )}
        </div>
        <p className="text-[12px] text-[#232C32]">
          {isMigrating
            ? "Moving devices from source to destination dashboard. Do not close this window."
            : isRollingBack
              ? "Reversing completed stages. This may take up to 40 seconds."
              : rollbackDone
                ? "Devices have been rolled back to the source dashboard."
                : "The migration process has paused."}
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Logs */}
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[#333232]">Live Migration Log</p>

          <div className="h-80 p-4 font-mono text-sm text-[#D5D5D5] bg-black border border-[#B3B3B3] rounded-md overflow-y-auto">
            {logs.map((entry, index) => (
              <div key={index} className="whitespace-pre-wrap leading-relaxed">
                {entry}
              </div>
            ))}
          </div>
        </div>

        {showRetry && (
          <>
            <AlertCard variant="error">
              <p>
                <strong>Failed at: </strong> <br />
                {failedStageText} <br />
                {error}
              </p>
            </AlertCard>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 flex flex-col items-center gap-3">
                <CustomButton
                  onClick={handleRetry}
                  bg_prop="bg-green-600 enabled:hover:bg-green-700"
                  className="w-full"
                >
                  <RefreshCw size={16} />
                  Retry from Stage {stageReached.current + 1}
                </CustomButton>

                <p className="text-xs text-center">
                  Resumes from Stage {stageReached.current + 1} — skips
                  already-completed stages.
                </p>
              </div>

              <div className="col-span-1 flex flex-col items-center gap-3">
                <CustomButton
                  onClick={handleRollback}
                  bg_prop="bg-red-600 enabled:hover:bg-red-700"
                  className="w-full"
                >
                  <Undo2 size={16} />
                  Roll Back
                </CustomButton>

                <p className="text-xs text-center">
                  Undoes all completed stages and returns devices to the source
                  dashboard.
                </p>
              </div>

              <div className="col-span-1 flex flex-col items-center gap-3">
                <CustomButton onClick={handleSkip} className="w-full">
                  Skip to Restore
                  <ArrowRight size={16} />
                </CustomButton>

                <p className="text-xs text-center">
                  Use if you fixed the issue manually in the Meraki dashboard.
                </p>
              </div>
            </div>
          </>
        )}

        {rollbackDone && (
          <AlertCard variant="warning">
            <p>
              <strong>Rollback complete. </strong>Please verify device status in
              both dashboards before retrying. Restart the wizard when you are
              ready to attempt migration again.
            </p>
          </AlertCard>
        )}
      </div>
    </div>
  );
}
