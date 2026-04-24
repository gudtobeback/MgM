import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();
router.use(authMiddleware);

const MERAKI_BASE_URL_COM = 'https://api.meraki.com/api/v1';
const MERAKI_BASE_URL_IN = 'https://api.meraki.in/api/v1';
const getBaseUrl = (region: string) => region === 'in' ? MERAKI_BASE_URL_IN : MERAKI_BASE_URL_COM;

/**
 * Helper to call Meraki API
 */
async function merakiRequest(apiKey: string, region: string, endpoint: string, method: string, body?: any) {
  const { default: fetch } = await import('node-fetch');
  const url = `${getBaseUrl(region)}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'X-Cisco-Meraki-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  try {
    return { ok: response.status < 400, status: response.status, data: JSON.parse(text) };
  } catch {
    return { ok: response.status < 400, status: response.status, data: text };
  }
}

/**
 * GET /api/organizations/:orgId/bulk/networks
 * List networks for bulk operation target selection
 */
router.get('/:orgId/bulk/networks', async (req: Request, res: Response) => {
  try {
    const org = await query(
      `SELECT meraki_org_id, meraki_api_key_encrypted, meraki_region
       FROM organizations WHERE id = $1 AND user_id = $2`,
      [req.params.orgId, req.user!.id]
    );

    if (org.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const { meraki_org_id, meraki_api_key_encrypted, meraki_region } = org.rows[0];
    const result = await merakiRequest(
      meraki_api_key_encrypted,
      meraki_region,
      `/organizations/${meraki_org_id}/networks`,
      'GET'
    );

    if (!result.ok) {
      return res.status(result.status).json({ error: 'Failed to fetch networks from Meraki' });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Fetch networks error:', error);
    res.status(500).json({ error: 'Failed to fetch networks' });
  }
});

/**
 * POST /api/organizations/:orgId/bulk/vlans
 * Apply VLAN configuration to multiple networks
 * Body: { networkIds: string[], vlanConfig: { id, name, subnet, applianceIp } }
 */
router.post('/:orgId/bulk/vlans', async (req: Request, res: Response) => {
  try {
    const { networkIds, vlanConfig } = req.body;

    if (!networkIds || !Array.isArray(networkIds) || networkIds.length === 0) {
      return res.status(400).json({ error: 'networkIds array is required' });
    }
    if (!vlanConfig || !vlanConfig.id || !vlanConfig.name) {
      return res.status(400).json({ error: 'vlanConfig with id and name is required' });
    }

    const org = await query(
      `SELECT meraki_org_id, meraki_api_key_encrypted, meraki_region
       FROM organizations WHERE id = $1 AND user_id = $2`,
      [req.params.orgId, req.user!.id]
    );

    if (org.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const { meraki_api_key_encrypted, meraki_region } = org.rows[0];

    const results = [];
    for (const networkId of networkIds) {
      // Add a delay to respect Meraki rate limits (max 10 req/sec)
      await new Promise(r => setTimeout(r, 120));

      const result = await merakiRequest(
        meraki_api_key_encrypted,
        meraki_region,
        `/networks/${networkId}/appliance/vlans`,
        'POST',
        vlanConfig
      );

      results.push({
        networkId,
        success: result.ok,
        status: result.status,
        error: result.ok ? undefined : (result.data as any)?.errors?.[0] ?? 'Unknown error',
      });
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    await query(
      `INSERT INTO audit_log (user_id, organization_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user!.id, req.params.orgId, 'bulk.vlan_created',
        JSON.stringify({ vlanId: vlanConfig.id, vlanName: vlanConfig.name, succeeded, failed })]
    );

    res.json({ succeeded, failed, results });
  } catch (error) {
    console.error('Bulk VLAN error:', error);
    res.status(500).json({ error: 'Bulk VLAN operation failed' });
  }
});

/**
 * POST /api/organizations/:orgId/bulk/firewall
 * Apply firewall rules to multiple networks
 * Body: { networkIds: string[], rules: FirewallRule[] }
 */
router.post('/:orgId/bulk/firewall', async (req: Request, res: Response) => {
  try {
    const { networkIds, rules } = req.body;

    if (!networkIds || !Array.isArray(networkIds) || networkIds.length === 0) {
      return res.status(400).json({ error: 'networkIds array is required' });
    }
    if (!rules || !Array.isArray(rules)) {
      return res.status(400).json({ error: 'rules array is required' });
    }

    const org = await query(
      `SELECT meraki_org_id, meraki_api_key_encrypted, meraki_region
       FROM organizations WHERE id = $1 AND user_id = $2`,
      [req.params.orgId, req.user!.id]
    );

    if (org.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const { meraki_api_key_encrypted, meraki_region } = org.rows[0];

    const results = [];
    for (const networkId of networkIds) {
      await new Promise(r => setTimeout(r, 120));

      const result = await merakiRequest(
        meraki_api_key_encrypted,
        meraki_region,
        `/networks/${networkId}/appliance/firewall/l3FirewallRules`,
        'PUT',
        { rules }
      );

      results.push({
        networkId,
        success: result.ok,
        status: result.status,
        error: result.ok ? undefined : (result.data as any)?.errors?.[0] ?? 'Unknown error',
      });
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    await query(
      `INSERT INTO audit_log (user_id, organization_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user!.id, req.params.orgId, 'bulk.firewall_rules_applied',
        JSON.stringify({ rulesCount: rules.length, succeeded, failed })]
    );

    res.json({ succeeded, failed, results });
  } catch (error) {
    console.error('Bulk firewall error:', error);
    res.status(500).json({ error: 'Bulk firewall operation failed' });
  }
});

/**
 * POST /api/organizations/:orgId/bulk/tags
 * Apply tags to multiple devices
 * Body: { serials: string[], tags: string[] }
 */
router.post('/:orgId/bulk/tags', async (req: Request, res: Response) => {
  try {
    const { serials, tags } = req.body;

    if (!serials || !Array.isArray(serials) || serials.length === 0) {
      return res.status(400).json({ error: 'serials array is required' });
    }
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'tags array is required' });
    }

    const org = await query(
      `SELECT meraki_api_key_encrypted, meraki_region
       FROM organizations WHERE id = $1 AND user_id = $2`,
      [req.params.orgId, req.user!.id]
    );

    if (org.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const { meraki_api_key_encrypted, meraki_region } = org.rows[0];

    const results = [];
    for (const serial of serials) {
      await new Promise(r => setTimeout(r, 120));

      const result = await merakiRequest(
        meraki_api_key_encrypted,
        meraki_region,
        `/devices/${serial}`,
        'PUT',
        { tags }
      );

      results.push({
        serial,
        success: result.ok,
        status: result.status,
        error: result.ok ? undefined : (result.data as any)?.errors?.[0] ?? 'Unknown error',
      });
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({ succeeded, failed, results });
  } catch (error) {
    console.error('Bulk tags error:', error);
    res.status(500).json({ error: 'Bulk tag operation failed' });
  }
});

export default router;
