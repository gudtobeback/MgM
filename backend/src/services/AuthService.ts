import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface UserPayload {
  id: string;
  email: string;
  subscriptionTier: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserPayload;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(email: string, password: string, fullName?: string): Promise<AuthTokens> {
    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, subscription_tier, subscription_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, subscription_tier`,
      [email, passwordHash, fullName || null, 'free', 'active']
    );

    const user = result.rows[0];

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [user.id, 'user.registered', JSON.stringify({ email })]
    );

    // Generate tokens
    return this.generateTokens({
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscription_tier
    });
  }

  /**
   * Login user
   */
  static async login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    // Get user
    const result = await query(
      'SELECT id, email, password_hash, subscription_tier FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'user.login', ipAddress || null, userAgent || null]
    );

    // Generate tokens
    return this.generateTokens({
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscription_tier
    });
  }

  /**
   * Generate JWT tokens
   */
  static generateTokens(payload: UserPayload): AuthTokens {
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    return {
      accessToken,
      refreshToken,
      user: payload
    };
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): UserPayload & Record<string, any> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload & Record<string, any>;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh access token
   */
  static refreshAccessToken(refreshToken: string): AuthTokens {
    const decoded = this.verifyToken(refreshToken);
    // Strip JWT standard claims (exp, iat, nbf, etc.) so jwt.sign can apply
    // fresh expiresIn without hitting the "payload already has exp" error.
    const payload: UserPayload = {
      id: decoded.id,
      email: decoded.email,
      subscriptionTier: decoded.subscriptionTier,
    };
    return this.generateTokens(payload);
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const result = await query(
      `SELECT id, email, full_name, subscription_tier, subscription_status, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Update user subscription
   */
  static async updateSubscription(userId: string, tier: string, status: string) {
    await query(
      `UPDATE users
       SET subscription_tier = $1, subscription_status = $2
       WHERE id = $3`,
      [tier, status, userId]
    );

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [userId, 'user.subscription_updated', JSON.stringify({ tier, status })]
    );
  }
}
