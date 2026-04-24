import { Router, Request, Response } from 'express';
import { DriftService } from '../services/DriftService';
import { ComplianceService } from '../services/ComplianceService';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/organizations/:orgId/drift
 * Detect drift.
 *
 * Optional query param:
 *   baselineSnapshotId — if supplied, compares the latest snapshot against this
 *                        specific "golden config" snapshot.
 *                        If omitted, compares the two most recent snapshots.
 */
router.get('/:orgId/drift', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const baselineSnapshotId = req.query.baselineSnapshotId as string | undefined;
    const report = await DriftService.detectDrift(orgId, baselineSnapshotId);
    res.json(report);
  } catch (error) {
    console.error('Drift detection error:', error);
    const message = error instanceof Error ? error.message : 'Failed to run drift detection';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/organizations/:orgId/compliance
 * Run compliance checks against the latest snapshot
 */
router.get('/:orgId/compliance', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { snapshotId } = req.query;
    const report = await ComplianceService.runChecks(orgId, snapshotId as string | undefined);
    res.json(report);
  } catch (error) {
    console.error('Compliance check error:', error);
    res.status(500).json({ error: 'Failed to run compliance checks' });
  }
});

/**
 * GET /api/compliance/rules
 * List all available compliance rules
 */
router.get('/compliance/rules', async (_req: Request, res: Response) => {
  try {
    const rules = ComplianceService.getRules();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get compliance rules' });
  }
});

export default router;
