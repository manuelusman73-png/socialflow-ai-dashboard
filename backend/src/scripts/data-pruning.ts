import { runDataPruning } from '../retention/dataPruningService';

const main = async (): Promise<void> => {
  const summary = await runDataPruning();
  console.log('[data-pruning] Completed:', JSON.stringify(summary, null, 2));
};

void main().catch((error) => {
  console.error('[data-pruning] Failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});