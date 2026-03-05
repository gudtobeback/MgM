import { Router, Request, Response } from 'express';
import { SecurityService } from '../services/SecurityService';
import { authMiddleware } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/organizations/:orgId/security
 * Run security posture analysis
 */
router.get('/:orgId/security', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { snapshotId } = req.query;

    const report = await SecurityService.analyzePosture(
      orgId,
      snapshotId as string | undefined
    );
    res.json(report);
  } catch (error) {
    console.error('Security posture error:', error);
    res.status(500).json({ error: 'Failed to run security analysis' });
  }
});

/**
 * GET /api/organizations/:orgId/changes
 * List change management records with approval status
 */
router.get('/:orgId/changes', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { status, limit = '20', offset = '0' } = req.query;

    let baseQuery = `
      SELECT cr.*, u.email as requested_by_email,
             a.email as approved_by_email
      FROM change_requests cr
      LEFT JOIN users u ON cr.requested_by = u.id
      LEFT JOIN users a ON cr.approved_by = a.id
      WHERE cr.organization_id = $1
    `;
    const params: any[] = [orgId];

    if (status) {
      params.push(status);
      baseQuery += ` AND cr.status = $${params.length}`;
    }

    baseQuery += ` ORDER BY cr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(baseQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error('List changes error:', error);
    res.status(500).json({ error: 'Failed to fetch change requests' });
  }
});

/**
 * POST /api/organizations/:orgId/changes
 * Create a change request
 */
router.post('/:orgId/changes', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { title, description, changeType, plannedAt, affectedResources } = req.body;

    if (!title || !description || !changeType) {
      return res.status(400).json({ error: 'title, description, and changeType are required' });
    }

    const result = await query(
      `INSERT INTO change_requests
         (organization_id, title, description, change_type, status, planned_at, affected_resources, requested_by)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
       RETURNING *`,
      [orgId, title, description, changeType,
       plannedAt || null,
       affectedResources ? JSON.stringify(affectedResources) : null,
       req.user!.id]
    );

    await query(
      `INSERT INTO audit_log (user_id, organization_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user!.id, orgId, 'change.requested',
       JSON.stringify({ title, changeType })]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create change request error:', error);
    res.status(500).json({ error: 'Failed to create change request' });
  }
});

/**
 * PATCH /api/organizations/:orgId/changes/:changeId
 * Approve or reject a change request
 */
router.patch('/:orgId/changes/:changeId', async (req: Request, res: Response) => {
  try {
    const { orgId, changeId } = req.params;
    const { action, notes } = req.body; // action: 'approve' | 'reject' | 'complete'

    if (!action || !['approve', 'reject', 'complete', 'cancel'].includes(action)) {
      return res.status(400).json({ error: 'action must be approve, reject, complete, or cancel' });
    }

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      complete: 'completed',
      cancel: 'cancelled',
    };

    const result = await query(
      `UPDATE change_requests
       SET status = $1,
           approved_by = CASE WHEN $1 IN ('approved', 'rejected') THEN $2 ELSE approved_by END,
           approved_at = CASE WHEN $1 IN ('approved', 'rejected') THEN NOW() ELSE approved_at END,
           completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
           notes = COALESCE($3, notes),
           updated_at = NOW()
       WHERE id = $4 AND organization_id = $5
       RETURNING *`,
      [statusMap[action], req.user!.id, notes || null, changeId, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Change request not found' });
    }

    await query(
      `INSERT INTO audit_log (user_id, organization_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user!.id, orgId, `change.${action}d`,
       JSON.stringify({ changeId, title: result.rows[0].title })]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update change request error:', error);
    res.status(500).json({ error: 'Failed to update change request' });
  }
});

export default router;
