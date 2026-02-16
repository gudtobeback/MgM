import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to restrict access to users with specific roles.
 * Must be used after authMiddleware (which populates req.user).
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes((req.user as any).role ?? 'user')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
