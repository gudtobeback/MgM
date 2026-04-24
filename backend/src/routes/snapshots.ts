import { Router, Request, Response } from 'express';
import { SnapshotService } from '../services/SnapshotService';
import { authMiddleware, requireSubscription } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/organizations/:orgId/snapshots/stream
 * Create a snapshot while streaming progress events via Server-Sent Events.
 * Query params: type, notes
 * Must be registered BEFORE /:orgId/snapshots/:snapshotId to avoid route conflict.
 */
router.get('/:orgId/snapshots/stream', requireSubscription(['essentials', 'professional', 'enterprise', 'msp']), async (req: Request, res: Response) => {
  const { orgId } = req.params;
  const type = (req.query.type as string) || 'manual';
  const notes = (req.query.notes as string) || undefined;

  if (!['manual', 'scheduled', 'pre-change', 'post-change'].includes(type)) {
    return res.status(400).json({ error: 'Invalid snapshot type' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    // Flush if supported (e.g. compression middleware)
    if (typeof (res as any).flush === 'function') (res as any).flush();
  };

  try {
    const snapshot = await SnapshotService.createSnapshot(
      orgId, type as any, req.user?.id, notes,
      (event) => send(event)
    );
    send({ step: 'result', status: 'done', snapshot });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create snapshot';
    send({ step: 'result', status: 'error', error: message });
  } finally {
    res.end();
  }
});

/**
 * POST /api/organizations/:orgId/snapshots
 * Create a new snapshot
 */
router.post('/:orgId/snapshots', requireSubscription(['essentials', 'professional', 'enterprise', 'msp']), async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { type, notes } = req.body;

    if (!type || !['manual', 'scheduled', 'pre-change', 'post-change'].includes(type)) {
      return res.status(400).json({ error: 'Valid snapshot type is required' });
    }

    const snapshot = await SnapshotService.createSnapshot(orgId, type, req.user?.id, notes);

    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Create snapshot error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create snapshot';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/organizations/:orgId/snapshots
 * List snapshots for an organization
 */
router.get('/:orgId/snapshots', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { type, limit, offset } = req.query;

    const snapshots = await SnapshotService.listSnapshots(orgId, {
      type: type as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json(snapshots);
  } catch (error) {
    console.error('List snapshots error:', error);
    res.status(500).json({ error: 'Failed to list snapshots' });
  }
});

/**
 * GET /api/organizations/:orgId/snapshots/compare
 * Compare two snapshots
 * NOTE: must be registered BEFORE /:snapshotId to prevent "compare" being
 *       captured as a snapshot ID parameter.
 */
router.get('/:orgId/snapshots/compare', async (req: Request, res: Response) => {
  try {
    const { snapshot1, snapshot2 } = req.query;

    if (!snapshot1 || !snapshot2) {
      return res.status(400).json({ error: 'Both snapshot1 and snapshot2 are required' });
    }

    const diff = await SnapshotService.compareSnapshots(snapshot1 as string, snapshot2 as string);

    res.json(diff);
  } catch (error) {
    console.error('Compare snapshots error:', error);
    const message = error instanceof Error ? error.message : 'Failed to compare snapshots';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/organizations/:orgId/snapshots/:snapshotId
 * Get a specific snapshot
 */
router.get('/:orgId/snapshots/:snapshotId', async (req: Request, res: Response) => {
  try {
    const { snapshotId } = req.params;

    const snapshot = await SnapshotService.getSnapshot(snapshotId);

    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    res.json(snapshot);
  } catch (error) {
    console.error('Get snapshot error:', error);
    res.status(500).json({ error: 'Failed to get snapshot' });
  }
});

/**
 * DELETE /api/organizations/:orgId/snapshots/:snapshotId
 * Delete a snapshot
 */
router.delete('/:orgId/snapshots/:snapshotId', async (req: Request, res: Response) => {
  try {
    const { snapshotId } = req.params;

    await SnapshotService.deleteSnapshot(snapshotId, req.user!.id);

    res.status(204).send();
  } catch (error) {
    console.error('Delete snapshot error:', error);
    res.status(500).json({ error: 'Failed to delete snapshot' });
  }
});

export default router;
