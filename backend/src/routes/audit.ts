import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { AuditLogStore } from '../models/AuditLog';
import { parsePageLimit, buildPageResponse } from '../utils/pagination';

const router = Router();

/**
 * GET /api/audit
 * Returns the most recent audit log entries (admin view).
 * Query: page (default 1), limit (default 20, max 100)
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const params  = parsePageLimit(req);
  const all     = AuditLogStore.recent(500);
  const total   = all.length;
  const start   = (params.page - 1) * params.limit;
  const data    = all.slice(start, start + params.limit);
  return res.json(buildPageResponse(req, data, total, params));
});

/**
 * GET /api/audit/me
 * Returns audit log entries for the authenticated user.
 */
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const params  = parsePageLimit(req);
  const all     = AuditLogStore.forActor(req.userId!, 500);
  const total   = all.length;
  const start   = (params.page - 1) * params.limit;
  const data    = all.slice(start, start + params.limit);
  return res.json(buildPageResponse(req, data, total, params));
});

/**
 * GET /api/audit/resource/:type/:id
 * Returns audit log entries for a specific resource.
 */
router.get('/resource/:type/:id', authMiddleware, (req: Request, res: Response) => {
  return res.json(AuditLogStore.forResource(req.params.type, req.params.id));
});

export default router;
