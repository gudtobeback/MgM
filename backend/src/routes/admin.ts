import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import bcrypt from 'bcrypt';

const router = Router();

// All routes in this file require super_admin (enforced by server.ts mount)

/**
 * GET /api/admin/companies
 * List all companies
 */
router.get('/companies', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT c.id, c.name, c.created_at,
              COUNT(u.id)::int AS user_count
       FROM companies c
       LEFT JOIN users u ON u.company_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List companies error:', err);
    res.status(500).json({ error: 'Failed to list companies' });
  }
});

/**
 * POST /api/admin/companies
 * Create a new company
 */
router.post('/companies', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

    const result = await query(
      `INSERT INTO companies (name) VALUES ($1) RETURNING id, name, created_at`,
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create company error:', err);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

/**
 * GET /api/admin/companies/:id
 * Get company details + its users
 */
router.get('/companies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const companyResult = await query(
      `SELECT id, name, created_at FROM companies WHERE id = $1`,
      [id]
    );
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const usersResult = await query(
      `SELECT id, email, full_name, role, subscription_tier, created_at
       FROM users WHERE company_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    res.json({ ...companyResult.rows[0], users: usersResult.rows });
  } catch (err) {
    console.error('Get company error:', err);
    res.status(500).json({ error: 'Failed to get company' });
  }
});

/**
 * PATCH /api/admin/companies/:id
 * Update company name
 */
router.patch('/companies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

    const result = await query(
      `UPDATE companies SET name = $1 WHERE id = $2 RETURNING id, name, created_at`,
      [name.trim(), id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Company not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update company error:', err);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

/**
 * DELETE /api/admin/companies/:id
 * Delete a company (cannot delete id=1 default)
 */
router.delete('/companies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (id === '1') return res.status(400).json({ error: 'Cannot delete the default company' });

    await query(`DELETE FROM companies WHERE id = $1`, [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete company error:', err);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

/**
 * GET /api/admin/users
 * List ALL users across all companies
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.role, u.subscription_tier,
              u.company_id, c.name AS company_name, u.created_at
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List all users error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user role, company_id, or subscriptionTier
 */
router.patch('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, companyId, subscriptionTier } = req.body;

    const VALID_ROLES = ['super_admin', 'company_admin', 'user'];
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (role !== undefined) { updates.push(`role = $${idx++}`); values.push(role); }
    if (companyId !== undefined) { updates.push(`company_id = $${idx++}`); values.push(companyId); }
    if (subscriptionTier !== undefined) { updates.push(`subscription_tier = $${idx++}`); values.push(subscriptionTier); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, role, company_id, subscription_tier`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const selfId = (req.user as any).id;
    if (String(id) === String(selfId)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await query(`DELETE FROM users WHERE id = $1`, [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/admin/audit
 * Recent audit log entries (all users)
 */
router.get('/audit', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await query(
      `SELECT a.id, a.action, a.details, a.ip_address, a.created_at,
              u.email AS user_email
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

export default router;
