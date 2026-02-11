import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { CrossRegionService } from '../services/CrossRegionService';
import { query } from '../config/database';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/cross-region/compare?sourceOrgId=xxx&targetOrgId=yyy
 * Compare configurations of two organizations (any region).
 */
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const { sourceOrgId, targetOrgId } = req.query as { sourceOrgId: string; targetOrgId: string };

    if (!sourceOrgId || !targetOrgId) {
      return res.status(400).json({ error: 'sourceOrgId and targetOrgId are required' });
    }

    if (sourceOrgId === targetOrgId) {
      return res.status(400).json({ error: 'sourceOrgId and targetOrgId must be different' });
    }

    // Verify both orgs belong to this user
    const ownerCheck = await query(
      `SELECT id FROM organizations WHERE id = ANY($1::uuid[]) AND user_id = $2 AND is_active = true`,
      [[sourceOrgId, targetOrgId], req.user!.id]
    );

    if (ownerCheck.rows.length < 2) {
      return res.status(403).json({ error: 'One or both organizations not accessible' });
    }

    const report = await CrossRegionService.compareOrgs(sourceOrgId, targetOrgId);
    res.json(report);
  } catch (error: any) {
    console.error('Cross-region compare error:', error);
    const status = error.message?.includes('No snapshot') ? 422 : 500;
    res.status(status).json({ error: error.message || 'Cross-region comparison failed' });
  }
});

/**
 * GET /api/cross-region/organizations
 * List all active organizations for the current user (for selecting source/target).
 */
router.get('/organizations', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, meraki_org_id, meraki_org_name, meraki_region, device_count, last_synced_at
       FROM organizations
       WHERE user_id = $1 AND is_active = true
       ORDER BY meraki_region, meraki_org_name`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('List cross-region orgs error:', error);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
});

export default router;
