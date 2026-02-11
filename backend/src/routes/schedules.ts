import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { SchedulerService } from '../services/SchedulerService';
import { query } from '../config/database';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/organizations/:orgId/schedule
 * Get the current schedule config for an organization
 */
router.get('/:orgId/schedule', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;

    // Verify ownership
    const org = await query(
      `SELECT id, meraki_org_name, schedule_config FROM organizations WHERE id = $1 AND user_id = $2 AND is_active = true`,
      [orgId, req.user!.id]
    );
    if (org.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const config = org.rows[0].schedule_config || null;
    const history = await SchedulerService.getSnapshotHistory(orgId);

    res.json({ schedule: config, history });
  } catch (error: any) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Failed to get schedule' });
  }
});

/**
 * PUT /api/organizations/:orgId/schedule
 * Set or update the schedule config for an organization
 */
router.put('/:orgId/schedule', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { enabled, frequency, hour, dayOfWeek, retainCount } = req.body;

    // Verify ownership
    const org = await query(
      `SELECT id FROM organizations WHERE id = $1 AND user_id = $2 AND is_active = true`,
      [orgId, req.user!.id]
    );
    if (org.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (!['hourly', 'daily', 'weekly'].includes(frequency)) {
      return res.status(400).json({ error: 'frequency must be hourly, daily, or weekly' });
    }

    const config = {
      enabled: !!enabled,
      frequency,
      hour: hour !== undefined ? Number(hour) : 2,
      dayOfWeek: dayOfWeek !== undefined ? Number(dayOfWeek) : 0,
      retainCount: retainCount !== undefined ? Number(retainCount) : 10,
    };

    await SchedulerService.setSchedule(orgId, config);

    await query(
      `INSERT INTO audit_log (user_id, organization_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user!.id, orgId, 'schedule.updated', JSON.stringify(config)]
    );

    res.json({ message: 'Schedule updated', schedule: config });
  } catch (error: any) {
    console.error('Set schedule error:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

/**
 * DELETE /api/organizations/:orgId/schedule
 * Disable / remove the schedule for an organization
 */
router.delete('/:orgId/schedule', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;

    const org = await query(
      `SELECT id FROM organizations WHERE id = $1 AND user_id = $2 AND is_active = true`,
      [orgId, req.user!.id]
    );
    if (org.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    await SchedulerService.disableSchedule(orgId);
    res.json({ message: 'Schedule disabled' });
  } catch (error: any) {
    console.error('Disable schedule error:', error);
    res.status(500).json({ error: 'Failed to disable schedule' });
  }
});

/**
 * POST /api/organizations/:orgId/schedule/trigger
 * Manually trigger a scheduled snapshot immediately
 */
router.post('/:orgId/schedule/trigger', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;

    const org = await query(
      `SELECT id, meraki_org_id, meraki_api_key_encrypted, meraki_region, schedule_config
       FROM organizations WHERE id = $1 AND user_id = $2 AND is_active = true`,
      [orgId, req.user!.id]
    );
    if (org.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const { meraki_api_key_encrypted, meraki_org_id, meraki_region, schedule_config } = org.rows[0];

    // Fetch current config from Meraki
    const baseUrl = meraki_region === 'in' ? 'https://api.meraki.in/api/v1' : 'https://api.meraki.com/api/v1';
    const headers = { 'X-Cisco-Meraki-API-Key': meraki_api_key_encrypted, 'Content-Type': 'application/json' };

    const [networksRes, devicesRes] = await Promise.allSettled([
      fetch(`${baseUrl}/organizations/${meraki_org_id}/networks`, { headers }),
      fetch(`${baseUrl}/organizations/${meraki_org_id}/devices`, { headers }),
    ]);

    const networks = networksRes.status === 'fulfilled' && networksRes.value.ok
      ? await networksRes.value.json() : [];
    const devices = devicesRes.status === 'fulfilled' && devicesRes.value.ok
      ? await devicesRes.value.json() : [];

    const snapshotData = { networks, devices, vlans: [], ssids: [], l3FirewallRules: [] };
    const sizeBytes = JSON.stringify(snapshotData).length;

    const snap = await query(
      `INSERT INTO config_snapshots (organization_id, snapshot_type, snapshot_data, size_bytes, created_by, notes)
       VALUES ($1, 'scheduled', $2, $3, $4, $5)
       RETURNING id, created_at`,
      [orgId, JSON.stringify(snapshotData), sizeBytes, req.user!.id, 'Manually triggered scheduled snapshot']
    );

    // Prune old snapshots
    const retainCount = schedule_config?.retainCount || 10;
    const pruned = await SchedulerService.pruneOldSnapshots(orgId, retainCount);

    res.json({
      message: 'Snapshot created',
      snapshotId: snap.rows[0].id,
      createdAt: snap.rows[0].created_at,
      pruned,
    });
  } catch (error: any) {
    console.error('Trigger snapshot error:', error);
    res.status(500).json({ error: error.message || 'Failed to trigger snapshot' });
  }
});

export default router;
