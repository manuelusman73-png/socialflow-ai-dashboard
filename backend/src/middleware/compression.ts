import compression, { CompressionOptions } from 'compression';
import { Request, Response } from 'express';
import zlib from 'zlib';

/**
 * Minimum response size (bytes) before compression is applied.
 * Compressing tiny payloads wastes CPU with no bandwidth benefit.
 * Default: 1 KB
 */
const COMPRESSION_THRESHOLD = parseInt(process.env.COMPRESSION_THRESHOLD ?? '1024', 10);

/**
 * Only compress compressible content types (JSON, text, JS, etc.).
 * Skip already-compressed formats like images, video, and binary streams.
 */
function shouldCompress(req: Request, res: Response): boolean {
  // Respect the caller's explicit opt-out
  if (req.headers['x-no-compression']) return false;

  const contentType = res.getHeader('Content-Type') as string | undefined;
  if (contentType) {
    // Skip already-compressed or binary content
    if (/^(image|video|audio)\//i.test(contentType)) return false;
    if (/application\/(zip|gzip|octet-stream|pdf)/i.test(contentType)) return false;
  }

  return compression.filter(req, res);
}

/**
 * Gzip compression options — used as the primary strategy.
 * The `compression` package negotiates Gzip via Accept-Encoding automatically.
 */
const compressionOptions: CompressionOptions = {
  filter:    shouldCompress,
  threshold: COMPRESSION_THRESHOLD,
  level:     zlib.constants.Z_DEFAULT_COMPRESSION, // balanced speed vs ratio
};

/**
 * Express middleware that applies Gzip (and Brotli where supported) compression
 * to all qualifying responses.
 *
 * Brotli note: the `compression` package delegates encoding negotiation to Node's
 * built-in zlib. When the client sends `Accept-Encoding: br`, Node will use
 * Brotli automatically on Node 18+. No extra configuration is required.
 *
 * Threshold and behaviour are configurable via environment variables:
 *   COMPRESSION_THRESHOLD — minimum bytes before compressing (default: 1024)
 */
export const compressionMiddleware = compression(compressionOptions);
