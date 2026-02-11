import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/analytics/overview
 * Returns platform-wide stats for the authenticated user
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Total organizations
    const orgsResult = await query(
      `SELECT COUNT(*) as total, SUM(device_count) as total_devices
       FROM organizations WHERE user_id = $1 AND is_active = true`,
      [userId]
    );

    // Total snapshots across all orgs
    const snapshotsResult = await query(
      `SELECT COUNT(*) as total,
              MAX(cs.created_at) as last_snapshot_at
       FROM config_snapshots cs
       JOIN organizations o ON cs.organization_id = o.id
       WHERE o.user_id = $1`,
      [userId]
    );

    // Snapshot activity over the last 30 days (daily counts)
    const activityResult = await query(
      `SELECT DATE(cs.created_at) as day, COUNT(*) as count
       FROM config_snapshots cs
       JOIN organizations o ON cs.organization_id = o.id
       WHERE o.user_id = $1
         AND cs.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(cs.created_at)
       ORDER BY day ASC`,
      [userId]
    );

    // Recent audit events
    const recentActivity = await query(
      `SELECT al.action, al.created_at, al.details,
              o.meraki_org_name
       FROM audit_log al
       LEFT JOIN organizations o ON al.organization_id = o.id
       WHERE al.user_id = $1
       ORDER BY al.created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Config changes over the last 7 days
    const changesResult = await query(
      `SELECT cc.change_action, COUNT(*) as count
       FROM config_changes cc
       JOIN organizations o ON cc.organization_id = o.id
       WHERE o.user_id = $1
         AND cc.changed_at >= NOW() - INTERVAL '7 days'
       GROUP BY cc.change_action`,
      [userId]
    );

    // Per-organization snapshot counts
    const orgSnapshots = await query(
      `SELECT o.id, o.meraki_org_name, o.device_count, o.meraki_region,
              COUNT(cs.id) as snapshot_count,
              MAX(cs.created_at) as last_snapshot_at
       FROM organizations o
       LEFT JOIN config_snapshots cs ON cs.organization_id = o.id
       WHERE o.user_id = $1 AND o.is_active = true
       GROUP BY o.id, o.meraki_org_name, o.device_count, o.meraki_region
       ORDER BY snapshot_count DESC`,
      [userId]
    );

    const changesMap: Record<string, number> = {};
    for (const row of changesResult.rows) {
      changesMap[row.change_action] = parseInt(row.count);
    }

    res.json({
      summary: {
        totalOrganizations: parseInt(orgsResult.rows[0].total) || 0,
        totalDevices: parseInt(orgsResult.rows[0].total_devices) || 0,
        totalSnapshots: parseInt(snapshotsResult.rows[0].total) || 0,
        lastSnapshotAt: snapshotsResult.rows[0].last_snapshot_at,
      },
      snapshotActivity: activityResult.rows,
      recentActivity: recentActivity.rows,
      changesSummary: {
        created: changesMap['added'] || 0,
        modified: changesMap['modified'] || 0,
        deleted: changesMap['removed'] || 0,
      },
      organizations: orgSnapshots.rows,
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/analytics/organizations/:orgId
 * Per-organization analytics
 */
router.get('/organizations/:orgId', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;

    // Verify ownership
    const orgCheck = await query(
      `SELECT id, meraki_org_name, device_count FROM organizations WHERE id = $1 AND user_id = $2`,
      [orgId, req.user!.id]
    );
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Snapshot history
    const snapshots = await query(
      `SELECT DATE(created_at) as day, snapshot_type, COUNT(*) as count
       FROM config_snapshots
       WHERE organization_id = $1
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at), snapshot_type
       ORDER BY day ASC`,
      [orgId]
    );

    // Change breakdown by resource type
    const changesByType = await query(
      `SELECT resource_type, change_action, COUNT(*) as count
       FROM config_changes
       WHERE organization_id = $1
         AND changed_at >= NOW() - INTERVAL '30 days'
       GROUP BY resource_type, change_action
       ORDER BY count DESC`,
      [orgId]
    );

    // Total storage used
    const storage = await query(
      `SELECT SUM(size_bytes) as total_bytes, COUNT(*) as total_snapshots
       FROM config_snapshots WHERE organization_id = $1`,
      [orgId]
    );

    res.json({
      organization: orgCheck.rows[0],
      snapshotHistory: snapshots.rows,
      changesByType: changesByType.rows,
      storage: {
        totalBytes: parseInt(storage.rows[0].total_bytes) || 0,
        totalSnapshots: parseInt(storage.rows[0].total_snapshots) || 0,
      },
    });
  } catch (error) {
    console.error('Org analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch organization analytics' });
  }
});

export default router;
