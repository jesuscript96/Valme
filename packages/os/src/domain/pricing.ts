/**
 * Tarifas y cálculo de coste. Puro y fuera de `providers/anthropic.ts`, que lleva
 * `server-only`: esto lo necesita también la contabilidad de `ai_jobs` y los tests.
 */

/** Modelo por defecto de toda la aplicación. `providers/anthropic.ts` lo lee de aquí. */
export const DEFAULT_MODEL = "claude-opus-5-5";

export type Price = { input: number; output: number; cacheRead: number; cacheWrite: number };

/**
 * $ por millón de tokens. `cacheWrite` es la escritura con TTL de 1 h (2× la entrada),
 * que es la que usa todo el código (`cache_control: { ttl: "1h" }`).
 */
export const CLAUDE_PRICES: Record<string, Price> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 8 },
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 10 },
};

/** Tarifa del modelo por defecto. Se mantiene el nombre por compatibilidad. */
export const CLAUDE_PRICE = CLAUDE_PRICES[DEFAULT_MODEL];

/**
 * Un modelo que no está en la tabla (otro proveedor vía `OS_LLM_BASE_URL`, o uno nuevo)
 * se cobra con la tarifa por defecto: es una estimación, no la factura.
 */
export function priceFor(model?: string | null): Price {
  return (model && CLAUDE_PRICES[model]) || CLAUDE_PRICE;
}

export type Usage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
};

export function costUsd(u: Usage, model?: string | null): number {
  const p = priceFor(model);
  return (
    (u.inputTokens * p.input +
      u.outputTokens * p.output +
      u.cacheReadTokens * p.cacheRead +
      u.cacheWriteTokens * p.cacheWrite) /
    1_000_000
  );
}

/**
 * Cuánto ahorra la caché frente a mandar el mismo prefijo sin marcar. Se enseña en la
 * pantalla de coste: sin un número delante, nadie mantiene el orden del prompt.
 */
export function cacheSavingUsd(u: Usage, model?: string | null): number {
  const p = priceFor(model);
  return (u.cacheReadTokens * (p.input - p.cacheRead)) / 1_000_000;
}

/** Suma dos usos: un bucle de agente hace muchas llamadas dentro de un mismo job. */
export function addUsage(a: Usage, b: Usage): Usage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
  };
}

export const ZERO_USAGE: Usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
