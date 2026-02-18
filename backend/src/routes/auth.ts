import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { authMiddleware } from '../middleware/auth';
import { query } from '../config/database';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const tokens = await AuthService.register(email, password, fullName);
    res.status(201).json(tokens);
  } catch (error) {
    console.error('Register error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const tokens = await AuthService.login(email, password, ipAddress, userAgent);
    res.json(tokens);
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const tokens = AuthService.refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

/**
 * GET /api/auth/me
 * Get current user details
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await AuthService.getUserById(req.user.id);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

/**
 * PATCH /api/auth/profile
 * Update current user's full name or password
 */
router.patch('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { fullName, currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'currentPassword is required to set a new password' });
      }
      const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

      const hash = await bcrypt.hash(newPassword, 10);
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    }

    if (fullName !== undefined) {
      await query('UPDATE users SET full_name = $1 WHERE id = $2', [fullName, userId]);
    }

    const user = await AuthService.getUserById(userId);
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/auth/permissions
 * Get current user's feature permissions
 * Returns { featureKey: boolean } — absent keys default to true (opt-out model)
 */
router.get('/permissions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT feature, enabled FROM user_permissions WHERE user_id = $1',
      [req.user!.id]
    );
    const permissions: Record<string, boolean> = {};
    result.rows.forEach((row: { feature: string; enabled: boolean }) => {
      permissions[row.feature] = row.enabled;
    });
    res.json(permissions);
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

/**
 * PATCH /api/auth/subscription
 * Update subscription tier (admin / demo use)
 */
router.patch('/subscription', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tier } = req.body;
    const VALID_TIERS = ['free', 'essentials', 'professional', 'enterprise', 'msp'];
    if (!tier || !VALID_TIERS.includes(tier)) {
      return res.status(400).json({ error: `tier must be one of: ${VALID_TIERS.join(', ')}` });
    }

    await AuthService.updateSubscription(req.user!.id, tier, 'active');

    // Re-issue tokens with updated tier so the UI updates immediately
    const updatedUser = await AuthService.getUserById(req.user!.id);
    const tokens = AuthService.generateTokens({
      id: updatedUser.id,
      email: updatedUser.email,
      subscriptionTier: updatedUser.subscription_tier,
      role: (req.user as any).role ?? 'user',
      companyId: (req.user as any).companyId ?? null,
    });

    res.json({ ...tokens, message: `Subscription updated to ${tier}` });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

export default router;
