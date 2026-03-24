import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

// Reuse the same instance across hot-reloads in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
