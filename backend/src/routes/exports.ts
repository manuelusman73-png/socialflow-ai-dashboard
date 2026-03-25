import { Router, Request, Response } from 'express';
import { ExportService } from '../services/ExportService';

const router = Router();

/**
 * GET /api/exports/analytics
 * Stream analytics data as CSV or JSON
 * Query params:
 *   organizationId {string} Required - Organization ID
 *   format {string} Required - 'csv' or 'json'
 *   startDate {string} Required - ISO date string
 *   endDate {string} Required - ISO date string
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { organizationId, format, startDate, endDate } = req.query;

    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    if (!format || !['csv', 'json'].includes(format as string)) {
      return res.status(400).json({ error: 'format must be "csv" or "json"' });
    }

    if (!startDate || typeof startDate !== 'string') {
      return res.status(400).json({ error: 'startDate is required (ISO format)' });
    }

    if (!endDate || typeof endDate !== 'string') {
      return res.status(400).json({ error: 'endDate is required (ISO format)' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (format === 'csv') {
      await ExportService.streamAnalyticsAsCSV(organizationId, start, end, res);
    } else {
      await ExportService.streamAnalyticsAsJSON(organizationId, start, end, res);
    }
  } catch (error) {
    console.error('Export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Export failed' });
    }
  }
});

/**
 * GET /api/exports/posts
 * Stream posts data as CSV or JSON
 * Query params:
 *   organizationId {string} Required - Organization ID
 *   format {string} Required - 'csv' or 'json'
 *   startDate {string} Required - ISO date string
 *   endDate {string} Required - ISO date string
 */
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const { organizationId, format, startDate, endDate } = req.query;

    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    if (!format || !['csv', 'json'].includes(format as string)) {
      return res.status(400).json({ error: 'format must be "csv" or "json"' });
    }

    if (!startDate || typeof startDate !== 'string') {
      return res.status(400).json({ error: 'startDate is required (ISO format)' });
    }

    if (!endDate || typeof endDate !== 'string') {
      return res.status(400).json({ error: 'endDate is required (ISO format)' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (format === 'csv') {
      await ExportService.streamPostsAsCSV(organizationId, start, end, res);
    } else {
      await ExportService.streamPostsAsJSON(organizationId, start, end, res);
    }
  } catch (error) {
    console.error('Export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Export failed' });
    }
  }
});

export default router;
