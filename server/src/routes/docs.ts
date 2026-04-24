import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { DocumentationService } from '../services/DocumentationService';

const router = Router();
router.use(authMiddleware);

// GET /api/organizations/:orgId/docs - Generate and return full documentation JSON
router.get('/:orgId/docs', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { snapshotId } = req.query;

    const doc = await DocumentationService.generateDoc(orgId, snapshotId as string | undefined);
    res.json(doc);
  } catch (error: any) {
    const status = error.message?.includes('not found') ? 404 : 500;
    res.status(status).json({ error: error.message || 'Failed to generate documentation' });
  }
});

// GET /api/organizations/:orgId/docs/download - Download as HTML or Markdown file
router.get('/:orgId/docs/download', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { snapshotId, format = 'html' } = req.query;

    const doc = await DocumentationService.generateDoc(orgId, snapshotId as string | undefined);
    const orgSlug = doc.organization.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const date = new Date(doc.snapshotDate).toISOString().split('T')[0];

    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="network-doc-${orgSlug}-${date}.md"`);
      res.send(doc.markdown);
    } else {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="network-doc-${orgSlug}-${date}.html"`);
      res.send(doc.html);
    }
  } catch (error: any) {
    const status = error.message?.includes('not found') ? 404 : 500;
    res.status(status).json({ error: error.message || 'Failed to download documentation' });
  }
});

export default router;
