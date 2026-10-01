/**
 * Tarifas y cálculo de coste. Puro y fuera de `providers/anthropic.ts`, que lleva
 * `server-only`: esto lo necesita también la contabilidad de `ai_jobs` y los tests.
 */

/** Claude Opus 5, $ por millón de tokens. La lectura de caché sale a ~0,1× la entrada. */
export const CLAUDE_PRICE = {
  input: 5,
  output: 25,
  cacheRead: 0.5,
  cacheWrite: 6.25,
} as const;

export type Usage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
};

export function costUsd(u: Usage): number {
  return (
    (u.inputTokens * CLAUDE_PRICE.input +
      u.outputTokens * CLAUDE_PRICE.output +
      u.cacheReadTokens * CLAUDE_PRICE.cacheRead +
      u.cacheWriteTokens * CLAUDE_PRICE.cacheWrite) /
    1_000_000
  );
}

/**
 * Cuánto ahorra la caché frente a mandar el mismo prefijo sin marcar. Se enseña en la
 * pantalla de coste: sin un número delante, nadie mantiene el orden del prompt.
 */
export function cacheSavingUsd(u: Usage): number {
  return (u.cacheReadTokens * (CLAUDE_PRICE.input - CLAUDE_PRICE.cacheRead)) / 1_000_000;
}
