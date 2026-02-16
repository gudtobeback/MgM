import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { query } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const MERAKI_REGION_BASES: Record<string, string> = {
  com: 'https://api.meraki.com/api/v1',
  in:  'https://api.meraki.in/api/v1',
  cn:  'https://api.meraki.cn/api/v1',
  ca:  'https://api.meraki.ca/api/v1',
  eu:  'https://api.meraki.eu/api/v1',
};

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/organizations
 * List all organizations for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const isSuperAdmin = user.role === 'super_admin';

    // super_admin sees all orgs; others see only their company's orgs (scoped by user_id)
    const result = await query(
      isSuperAdmin
        ? `SELECT id, meraki_org_id, meraki_org_name, meraki_region, is_active,
                  last_synced_at, device_count, created_at
           FROM organizations
           WHERE is_active = true
           ORDER BY created_at DESC`
        : `SELECT id, meraki_org_id, meraki_org_name, meraki_region, is_active,
                  last_synced_at, device_count, created_at
           FROM organizations
           WHERE user_id = $1 AND is_active = true
           ORDER BY created_at DESC`,
      isSuperAdmin ? [] : [user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List organizations error:', error);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
});

/**
 * POST /api/organizations
 * Add a new organization (validates API key against Meraki)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { merakiOrgId, merakiOrgName, merakiApiKey, merakiRegion } = req.body;

    if (!merakiOrgId || !merakiOrgName || !merakiApiKey || !merakiRegion) {
      return res.status(400).json({ error: 'merakiOrgId, merakiOrgName, merakiApiKey, and merakiRegion are required' });
    }

    if (!['com', 'in'].includes(merakiRegion)) {
      return res.status(400).json({ error: 'merakiRegion must be "com" or "in"' });
    }

    // Check if already exists for this user
    const existing = await query(
      `SELECT id FROM organizations WHERE user_id = $1 AND meraki_org_id = $2 AND meraki_region = $3`,
      [req.user!.id, merakiOrgId, merakiRegion]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'This organization is already connected' });
    }

    // Store the API key (in production this should be encrypted)
    const result = await query(
      `INSERT INTO organizations (user_id, meraki_org_id, meraki_org_name, meraki_api_key_encrypted, meraki_region)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, meraki_org_id, meraki_org_name, meraki_region, is_active, device_count, created_at`,
      [req.user!.id, merakiOrgId, merakiOrgName, merakiApiKey, merakiRegion]
    );

    // Audit log
    await query(
      `INSERT INTO audit_log (user_id, organization_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user!.id, result.rows[0].id, 'organization.connected', JSON.stringify({ orgName: merakiOrgName, region: merakiRegion })]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Failed to add organization' });
  }
});

/**
 * GET /api/organizations/:id
 * Get a single organization
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, meraki_org_id, meraki_org_name, meraki_region, is_active,
              last_synced_at, device_count, created_at
       FROM organizations
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Failed to get organization' });
  }
});

/**
 * PATCH /api/organizations/:id/sync
 * Update device count for an organization
 */
router.patch('/:id/sync', async (req: Request, res: Response) => {
  try {
    const { deviceCount } = req.body;

    const result = await query(
      `UPDATE organizations
       SET device_count = $1, last_synced_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, meraki_org_name, device_count, last_synced_at`,
      [deviceCount ?? 0, req.params.id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Sync organization error:', error);
    res.status(500).json({ error: 'Failed to sync organization' });
  }
});

/**
 * POST /api/organizations/:id/refresh
 * Fetch real device count from Meraki using the stored API key and update the DB
 */
router.post('/:id/refresh', async (req: Request, res: Response) => {
  try {
    // Get org with stored API key
    const orgResult = await query(
      `SELECT id, meraki_org_id, meraki_api_key_encrypted, meraki_region
       FROM organizations WHERE id = $1 AND user_id = $2 AND is_active = true`,
      [req.params.id, req.user!.id]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const org = orgResult.rows[0];
    const baseUrl = MERAKI_REGION_BASES[org.meraki_region] ?? MERAKI_REGION_BASES.com;

    // Fetch devices from Meraki API
    let deviceCount = 0;
    try {
      const merakiRes = await fetch(
        `${baseUrl}/organizations/${org.meraki_org_id}/devices`,
        { headers: { 'X-Cisco-Meraki-API-Key': org.meraki_api_key_encrypted } }
      );
      if (merakiRes.ok) {
        const devices = await merakiRes.json() as any[];
        deviceCount = Array.isArray(devices) ? devices.length : 0;
      }
    } catch {
      // Meraki unreachable — still update last_synced_at so we don't keep retrying
    }

    // Write back to DB
    const updated = await query(
      `UPDATE organizations
       SET device_count = $1, last_synced_at = NOW()
       WHERE id = $2
       RETURNING id, meraki_org_name, device_count, last_synced_at`,
      [deviceCount, org.id]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Refresh organization error:', error);
    res.status(500).json({ error: 'Failed to refresh organization' });
  }
});

/**
 * DELETE /api/organizations/:id
 * Remove an organization (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `UPDATE organizations SET is_active = false
       WHERE id = $1 AND user_id = $2
       RETURNING id, meraki_org_name`,
      [req.params.id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    await query(
      `INSERT INTO audit_log (user_id, organization_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user!.id, req.params.id, 'organization.disconnected', JSON.stringify({ orgName: result.rows[0].meraki_org_name })]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ error: 'Failed to remove organization' });
  }
});

export default router;
