import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import bcrypt from 'bcrypt';

const router = Router();

// All routes require company_admin or super_admin (enforced by server.ts mount)

/**
 * GET /api/company/users
 * List users in the caller's company.
 * super_admin sees all users; company_admin sees own company only.
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const isSuperAdmin = user.role === 'super_admin';

    let result;
    if (isSuperAdmin) {
      result = await query(
        `SELECT u.id, u.email, u.full_name, u.role, u.subscription_tier,
                u.company_id, c.name AS company_name, u.created_at
         FROM users u
         LEFT JOIN companies c ON c.id = u.company_id
         ORDER BY u.created_at DESC`
      );
    } else {
      result = await query(
        `SELECT u.id, u.email, u.full_name, u.role, u.subscription_tier,
                u.company_id, c.name AS company_name, u.created_at
         FROM users u
         LEFT JOIN companies c ON c.id = u.company_id
         WHERE u.company_id = $1
         ORDER BY u.created_at DESC`,
        [user.companyId]
      );
    }

    // Attach permissions for each user
    const userIds = result.rows.map((r: any) => r.id);
    if (userIds.length > 0) {
      const permResult = await query(
        `SELECT user_id, feature, enabled FROM user_permissions WHERE user_id = ANY($1::int[])`,
        [userIds]
      );
      const permMap: Record<number, Record<string, boolean>> = {};
      for (const perm of permResult.rows) {
        if (!permMap[perm.user_id]) permMap[perm.user_id] = {};
        permMap[perm.user_id][perm.feature] = perm.enabled;
      }
      result.rows = result.rows.map((u: any) => ({ ...u, permissions: permMap[u.id] ?? {} }));
    }

    res.json(result.rows);
  } catch (err) {
    console.error('List company users error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * POST /api/company/users
 * Create a new user in the caller's company.
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    const caller = req.user as any;
    const { email, password, fullName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // company_admin can only create 'user' or 'company_admin'; super_admin can create any
    const allowedRoles = caller.role === 'super_admin'
      ? ['super_admin', 'company_admin', 'user']
      : ['company_admin', 'user'];
    const assignedRole = role && allowedRoles.includes(role) ? role : 'user';
    const companyId = caller.role === 'super_admin' && req.body.companyId
      ? req.body.companyId
      : caller.companyId;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, subscription_tier, subscription_status, role, company_id)
       VALUES ($1, $2, $3, 'free', 'active', $4, $5)
       RETURNING id, email, full_name, role, company_id, created_at`,
      [email, passwordHash, fullName || null, assignedRole, companyId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create company user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PATCH /api/company/users/:id/permissions
 * Set feature permissions for a user in the caller's company.
 * Body: { permissions: { [feature]: boolean } }
 */
router.patch('/users/:id/permissions', async (req: Request, res: Response) => {
  try {
    const caller = req.user as any;
    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: 'permissions object is required' });
    }

    // Verify caller has access to this user
    if (caller.role !== 'super_admin') {
      const check = await query(
        `SELECT id FROM users WHERE id = $1 AND company_id = $2`,
        [id, caller.companyId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    // Upsert each permission
    for (const [feature, enabled] of Object.entries(permissions)) {
      await query(
        `INSERT INTO user_permissions (user_id, feature, enabled)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, feature) DO UPDATE SET enabled = EXCLUDED.enabled`,
        [id, feature, Boolean(enabled)]
      );
    }

    // Return updated permissions
    const result = await query(
      `SELECT feature, enabled FROM user_permissions WHERE user_id = $1`,
      [id]
    );
    const permMap: Record<string, boolean> = {};
    for (const row of result.rows) {
      permMap[row.feature] = row.enabled;
    }

    res.json({ userId: id, permissions: permMap });
  } catch (err) {
    console.error('Update permissions error:', err);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

/**
 * DELETE /api/company/users/:id
 * Remove a user from the company.
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const caller = req.user as any;
    const { id } = req.params;

    if (String(id) === String(caller.id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Verify caller has access to this user
    if (caller.role !== 'super_admin') {
      const check = await query(
        `SELECT id FROM users WHERE id = $1 AND company_id = $2`,
        [id, caller.companyId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    await query(`DELETE FROM users WHERE id = $1`, [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete company user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
