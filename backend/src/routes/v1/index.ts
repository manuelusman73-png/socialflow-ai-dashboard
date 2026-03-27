import { Router, Request, Response } from 'express';
import { authLimiter, aiLimiter, generalLimiter } from '../../middleware/rateLimit';

// Route modules
import authRoutes         from '../auth';
import aiRoutes           from '../ai';
import analyticsRoutes    from '../analytics';
import auditRoutes        from '../audit';
import billingRoutes      from '../billing';
import circuitBreakerRoutes from '../circuitBreaker';
import configRoutes       from '../config';
import exportsRoutes      from '../exports';
import facebookRoutes     from '../facebook';
import healthRoutes       from '../health';
import imagesRoutes       from '../images';
import jobsRoutes         from '../jobs';
import listingsRoutes     from '../listings';
import organizationsRoutes from '../organizations';
import realtimeRoutes     from '../realtime';
import rolesRoutes        from '../roles';
import statusRoutes       from '../status';
import tiktokRoutes       from '../tiktok';
import translationRoutes  from '../translation';
import ttsRoutes          from '../tts';
import videoRoutes        from '../video';
import webhookRoutes      from '../webhooks';
import twitterWebhookRoutes from '../twitter-webhook';
import youtubeRoutes      from '../youtube';

const router = Router();

// ── Version metadata ──────────────────────────────────────────────────────────
router.get('/', (_req: Request, res: Response) => {
  res.json({
    version: 'v1',
    status: 'stable',
    deprecated: false,
    sunsetDate: null,
    docs: '/api/v1/docs',
  });
});

// ── Health (no rate limiting) ─────────────────────────────────────────────────
router.use('/health', healthRoutes);
router.use('/status', statusRoutes);

// ── Auth (strict limiter — brute-force protection) ────────────────────────────
router.use('/auth', authLimiter, authRoutes);

// ── AI / high-cost endpoints ──────────────────────────────────────────────────
router.use('/ai',          aiLimiter, aiRoutes);
router.use('/tts',         aiLimiter, ttsRoutes);
router.use('/translation', aiLimiter, translationRoutes);

// ── General API (standard limiter) ───────────────────────────────────────────
router.use('/analytics',     generalLimiter, analyticsRoutes);
router.use('/audit',         generalLimiter, auditRoutes);
router.use('/billing',       generalLimiter, billingRoutes);
router.use('/circuit-breaker', generalLimiter, circuitBreakerRoutes);
router.use('/config',        generalLimiter, configRoutes);
router.use('/exports',       generalLimiter, exportsRoutes);
router.use('/facebook',      generalLimiter, facebookRoutes);
router.use('/images',        generalLimiter, imagesRoutes);
router.use('/jobs',          generalLimiter, jobsRoutes);
router.use('/listings',      generalLimiter, listingsRoutes);
router.use('/organizations', generalLimiter, organizationsRoutes);
router.use('/realtime',      generalLimiter, realtimeRoutes);
router.use('/roles',         generalLimiter, rolesRoutes);
router.use('/tiktok',        generalLimiter, tiktokRoutes);
router.use('/video',         generalLimiter, videoRoutes);
router.use('/webhooks',      generalLimiter, webhookRoutes);
// Twitter Account Activity API — no auth middleware, secured via HMAC signature
router.use('/webhooks/twitter', twitterWebhookRoutes);
router.use('/youtube',       generalLimiter, youtubeRoutes);

export default router;
