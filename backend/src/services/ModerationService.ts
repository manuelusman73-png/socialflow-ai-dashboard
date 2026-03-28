import { createLogger } from '../lib/logger';

const logger = createLogger('moderation-service');

export type SensitivityLevel = 'low' | 'medium' | 'high';

export interface ModerationResult {
  flagged: boolean;
  blocked: boolean;
  categories: Record<string, boolean>;
  scores: Record<string, number>;
  reason?: string;
}

/**
 * Thresholds per sensitivity level.
 * A category score above the threshold triggers a flag/block.
 *
 * low    — only block clearly harmful content (high threshold)
 * medium — balanced (default)
 * high   — strict; flag borderline content
 */
const THRESHOLDS: Record<SensitivityLevel, number> = {
  low: 0.85,
  medium: 0.6,
  high: 0.3,
};

/**
 * Categories that always result in a hard block regardless of sensitivity.
 */
const ALWAYS_BLOCK = new Set([
  'sexual/minors',
  'hate/threatening',
  'violence/graphic',
  'self-harm/instructions',
]);

function getSensitivity(): SensitivityLevel {
  const val = (process.env.MODERATION_SENSITIVITY ?? 'medium').toLowerCase();
  if (val === 'low' || val === 'high') return val;
  return 'medium';
}

/**
 * MODERATION_MODE controls behaviour when the provider is unavailable
 * (missing API key, timeout, or malformed response):
 *
 *   fail-open   (default) — bypass moderation and allow the content through.
 *                           Logs a warning. Use when availability > safety.
 *   fail-closed           — block the content and throw.
 *                           Use when safety > availability.
 */
function getMode(): 'fail-open' | 'fail-closed' {
  return process.env.MODERATION_MODE === 'fail-closed' ? 'fail-closed' : 'fail-open';
}

const BYPASS_RESULT: ModerationResult = { flagged: false, blocked: false, categories: {}, scores: {} };

export const ModerationService = {
  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  },

  /**
   * Moderate content using the OpenAI Moderation API.
   *
   * When the provider is unavailable the behaviour depends on MODERATION_MODE:
   *   fail-open   — returns a clean pass-through result (default)
   *   fail-closed — throws so the caller can block the content
   */
  async moderate(text: string): Promise<ModerationResult> {
    if (!this.isConfigured()) {
      const msg = 'ModerationService: OPENAI_API_KEY not set — skipping moderation';
      if (getMode() === 'fail-closed') {
        logger.error(msg);
        throw new Error('Moderation unavailable: OPENAI_API_KEY not set');
      }
      logger.warn(msg);
      return BYPASS_RESULT;
    }

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: text }),
      signal: AbortSignal.timeout(10_000),
    }).catch((err: unknown) => {
      const isTimeout = err instanceof Error && err.name === 'TimeoutError';
      const msg = isTimeout ? 'Moderation API timeout' : 'Moderation API unreachable';
      logger.error(msg, { error: err instanceof Error ? err.message : String(err) });
      if (getMode() === 'fail-closed') throw new Error(msg);
      logger.warn(`${msg} — failing open`);
      return null;
    });

    if (response === null) return BYPASS_RESULT;

    if (!response.ok) {
      const body = await response.text();
      logger.error('OpenAI Moderation API error', { status: response.status, body });
      throw new Error(`Moderation API returned ${response.status}`);
    }

    let data: {
      results: Array<{
        flagged: boolean;
        categories: Record<string, boolean>;
        category_scores: Record<string, number>;
      }>;
    };

    try {
      data = (await response.json()) as typeof data;
      if (!Array.isArray(data?.results) || !data.results[0]) throw new Error('unexpected shape');
    } catch {
      const msg = 'Moderation API returned malformed response';
      logger.error(msg);
      if (getMode() === 'fail-closed') throw new Error(msg);
      logger.warn(`${msg} — failing open`);
      return BYPASS_RESULT;
    }

    const result = data.results[0];
    const sensitivity = getSensitivity();
    const threshold = THRESHOLDS[sensitivity];

    // Hard block on always-blocked categories
    const hardBlock = Object.entries(result.categories).some(
      ([cat, active]) => active && ALWAYS_BLOCK.has(cat),
    );

    // Threshold-based flag for remaining categories
    const thresholdFlag = Object.entries(result.category_scores).some(
      ([, score]) => score >= threshold,
    );

    const flagged = result.flagged || thresholdFlag || hardBlock;
    const blocked = hardBlock || (flagged && sensitivity !== 'low');

    const reason = flagged
      ? Object.entries(result.categories)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(', ')
      : undefined;

    logger.info('Moderation result', { flagged, blocked, sensitivity, reason });

    return {
      flagged,
      blocked,
      categories: result.categories,
      scores: result.category_scores,
      reason,
    };
  },
};
