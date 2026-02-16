import { query } from '../config/database';

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  hour?: number;       // 0-23 for daily/weekly
  dayOfWeek?: number;  // 0-6 (Sunday=0) for weekly
  retainCount: number; // How many scheduled snapshots to keep
}

export interface ScheduledSnapshotResult {
  organizationId: string;
  organizationName: string;
  snapshotId: string;
  createdAt: string;
}

export class SchedulerService {
  /**
   * Get schedule config for an organization.
   * Returns null if no schedule is configured.
   */
  static async getSchedule(organizationId: string): Promise<ScheduleConfig | null> {
    const result = await query(
      `SELECT schedule_config FROM organizations WHERE id = $1`,
      [organizationId]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0].schedule_config || null;
  }

  /**
   * Update schedule config for an organization.
   */
  static async setSchedule(organizationId: string, config: ScheduleConfig): Promise<void> {
    await query(
      `UPDATE organizations SET schedule_config = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(config), organizationId]
    );
  }

  /**
   * Disable scheduling for an organization.
   */
  static async disableSchedule(organizationId: string): Promise<void> {
    await query(
      `UPDATE organizations SET schedule_config = NULL, updated_at = NOW() WHERE id = $1`,
      [organizationId]
    );
  }

  /**
   * Check which organizations are due for a scheduled snapshot right now.
   * Called by the cron runner.
   */
  static async getDueOrganizations(): Promise<Array<{ id: string; merakiOrgId: string; name: string; apiKey: string; region: string; config: ScheduleConfig }>> {
    const result = await query(
      `SELECT id, meraki_org_id, meraki_org_name, meraki_api_key_encrypted AS meraki_api_key, meraki_region, schedule_config
       FROM organizations
       WHERE schedule_config IS NOT NULL AND schedule_config->>'enabled' = 'true'`,
      []
    );

    const now = new Date();
    const currentHour = now.getHours();
    const currentDow = now.getDay();

    const due: Array<{ id: string; merakiOrgId: string; name: string; apiKey: string; region: string; config: ScheduleConfig }> = [];

    for (const row of result.rows) {
      const cfg: ScheduleConfig = row.schedule_config;
      if (!cfg.enabled) continue;

      let isDue = false;
      if (cfg.frequency === 'hourly') {
        isDue = true; // Runs every hour
      } else if (cfg.frequency === 'daily') {
        isDue = currentHour === (cfg.hour ?? 2);
      } else if (cfg.frequency === 'weekly') {
        isDue = currentDow === (cfg.dayOfWeek ?? 0) && currentHour === (cfg.hour ?? 2);
      }

      if (isDue) {
        due.push({
          id: row.id,
          merakiOrgId: row.meraki_org_id,
          name: row.meraki_org_name,
          apiKey: row.meraki_api_key,
          region: row.meraki_region,
          config: cfg,
        });
      }
    }

    return due;
  }

  /**
   * After creating a scheduled snapshot, prune old ones beyond retainCount.
   */
  static async pruneOldSnapshots(organizationId: string, retainCount: number): Promise<number> {
    // Get all scheduled snapshots ordered by date desc
    const result = await query(
      `SELECT id FROM config_snapshots
       WHERE organization_id = $1 AND snapshot_type = 'scheduled'
       ORDER BY created_at DESC`,
      [organizationId]
    );

    const toDelete = result.rows.slice(retainCount);
    if (toDelete.length === 0) return 0;

    const ids = toDelete.map((r: any) => r.id);
    await query(
      `DELETE FROM config_snapshots WHERE id = ANY($1::uuid[])`,
      [ids]
    );
    return toDelete.length;
  }

  /**
   * Get recent scheduled snapshot history for an org.
   */
  static async getSnapshotHistory(organizationId: string, limit = 20) {
    const result = await query(
      `SELECT id, snapshot_type, size_bytes, created_at, notes
       FROM config_snapshots
       WHERE organization_id = $1 AND snapshot_type = 'scheduled'
       ORDER BY created_at DESC LIMIT $2`,
      [organizationId, limit]
    );
    return result.rows;
  }
}
