import { Response } from 'express';
import { Readable } from 'stream';
import { prisma } from '../lib/prisma';

const BATCH_SIZE = 1000;

export const ExportService = {
  /**
   * Stream analytics data as CSV with cursor-based pagination
   */
  streamAnalyticsAsCSV: async (
    organizationId: string,
    startDate: Date,
    endDate: Date,
    res: Response
  ): Promise<void> => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');

    const csvStream = new Readable({
      read() {},
    });

    // Write CSV header
    csvStream.push('id,organizationId,platform,metric,value,recordedAt\n');

    let cursor: string | undefined;
    let hasMore = true;

    try {
      while (hasMore) {
        const batch = await prisma.analyticsEntry.findMany({
          where: {
            organizationId,
            recordedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          take: BATCH_SIZE + 1,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { id: 'asc' },
        });

        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        // Check if there are more records
        if (batch.length > BATCH_SIZE) {
          batch.pop();
        } else {
          hasMore = false;
        }

        // Write rows to stream
        for (const row of batch) {
          const csvRow = `${row.id},"${row.organizationId}","${row.platform}","${row.metric}",${row.value},"${row.recordedAt.toISOString()}"\n`;
          csvStream.push(csvRow);
        }

        cursor = batch[batch.length - 1]?.id;
      }

      csvStream.push(null);
    } catch (error) {
      csvStream.destroy(error as Error);
    }

    csvStream.pipe(res);
  },

  /**
   * Stream analytics data as JSON Lines (newline-delimited JSON)
   */
  streamAnalyticsAsJSON: async (
    organizationId: string,
    startDate: Date,
    endDate: Date,
    res: Response
  ): Promise<void> => {
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics.jsonl"');

    const jsonStream = new Readable({
      read() {},
    });

    let cursor: string | undefined;
    let hasMore = true;

    try {
      while (hasMore) {
        const batch = await prisma.analyticsEntry.findMany({
          where: {
            organizationId,
            recordedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          take: BATCH_SIZE + 1,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { id: 'asc' },
        });

        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        if (batch.length > BATCH_SIZE) {
          batch.pop();
        } else {
          hasMore = false;
        }

        for (const row of batch) {
          jsonStream.push(JSON.stringify(row) + '\n');
        }

        cursor = batch[batch.length - 1]?.id;
      }

      jsonStream.push(null);
    } catch (error) {
      jsonStream.destroy(error as Error);
    }

    jsonStream.pipe(res);
  },

  /**
   * Stream posts data as CSV
   */
  streamPostsAsCSV: async (
    organizationId: string,
    startDate: Date,
    endDate: Date,
    res: Response
  ): Promise<void> => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="posts.csv"');

    const csvStream = new Readable({
      read() {},
    });

    csvStream.push('id,organizationId,content,platform,scheduledAt,createdAt\n');

    let cursor: string | undefined;
    let hasMore = true;

    try {
      while (hasMore) {
        const batch = await prisma.post.findMany({
          where: {
            organizationId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          take: BATCH_SIZE + 1,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { id: 'asc' },
        });

        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        if (batch.length > BATCH_SIZE) {
          batch.pop();
        } else {
          hasMore = false;
        }

        for (const row of batch) {
          const content = row.content.replace(/"/g, '""');
          const csvRow = `${row.id},"${row.organizationId}","${content}","${row.platform}","${row.scheduledAt?.toISOString() || ''}","${row.createdAt.toISOString()}"\n`;
          csvStream.push(csvRow);
        }

        cursor = batch[batch.length - 1]?.id;
      }

      csvStream.push(null);
    } catch (error) {
      csvStream.destroy(error as Error);
    }

    csvStream.pipe(res);
  },

  /**
   * Stream posts data as JSON Lines
   */
  streamPostsAsJSON: async (
    organizationId: string,
    startDate: Date,
    endDate: Date,
    res: Response
  ): Promise<void> => {
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="posts.jsonl"');

    const jsonStream = new Readable({
      read() {},
    });

    let cursor: string | undefined;
    let hasMore = true;

    try {
      while (hasMore) {
        const batch = await prisma.post.findMany({
          where: {
            organizationId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          take: BATCH_SIZE + 1,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { id: 'asc' },
        });

        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        if (batch.length > BATCH_SIZE) {
          batch.pop();
        } else {
          hasMore = false;
        }

        for (const row of batch) {
          jsonStream.push(JSON.stringify(row) + '\n');
        }

        cursor = batch[batch.length - 1]?.id;
      }

      jsonStream.push(null);
    } catch (error) {
      jsonStream.destroy(error as Error);
    }

    jsonStream.pipe(res);
  },
};
