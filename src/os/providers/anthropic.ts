import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "./config";
import { costUsd, type Usage } from "@/os/domain/pricing";

/**
 * Cliente de Claude y contabilidad de coste.
 *
 * Modelo por defecto: Claude Opus 5. Pensamiento adaptativo (`budget_tokens` está
 * retirado en esta generación y devuelve 400) y salida estructurada vía
 * `output_config.format` — `output_format` está deprecado.
 */

/**
 * Modelo por defecto. Configurable para poder comparar proveedores sin tocar código:
 * tanto DeepSeek (`https://api.deepseek.com/anthropic`) como Z.ai
 * (`https://api.z.ai/api/anthropic`) exponen el protocolo de mensajes de Anthropic, y el
 * SDK lee `ANTHROPIC_BASE_URL` del entorno por su cuenta.
 *
 * AVISO antes de intentarlo: la salida estructurada de este código usa
 * `output_config.format`, que es propio de Anthropic. Sus capas de compatibilidad
 * podrían no admitirlo y habría que reescribir `structured()` contra el
 * `response_format` de sus endpoints OpenAI. Compruébalo antes de contar con ello.
 */
export const MODEL = process.env.OS_LLM_MODEL ?? "claude-opus-5";

export { costUsd };
export type { Usage };

let cached: Anthropic | null = null;
export function anthropic(): Anthropic {
  requireEnv("anthropic");
  cached ??= new Anthropic();
  return cached;
}

export function readUsage(res: { usage?: unknown }): Usage {
  const u = (res.usage ?? {}) as Record<string, unknown>;
  const n = (k: string) => (typeof u[k] === "number" ? (u[k] as number) : 0);
  return {
    inputTokens: n("input_tokens"),
    outputTokens: n("output_tokens"),
    cacheReadTokens: n("cache_read_input_tokens"),
    cacheWriteTokens: n("cache_creation_input_tokens"),
  };
}

/**
 * Una llamada con salida estructurada. Devuelve el JSON ya parseado más el uso.
 *
 * `system` se pasa como bloques para poder marcar el prefijo estable con
 * `cache_control`: el Brand Kit renderizado es idéntico entre ángulos y entre ediciones,
 * así que a partir de la segunda llamada esa parte se paga a ~0,1×. Lo estable primero,
 * lo volátil después — es la única regla que hace que la caché funcione.
 */
export async function structured<T>(opts: {
  system: { text: string; cache?: boolean }[];
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
}): Promise<{ value: T; usage: Usage }> {
  const res = await anthropic().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 16_000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: opts.effort ?? "high",
      format: { type: "json_schema", schema: opts.schema },
    },
    system: opts.system.map((s) => ({
      type: "text" as const,
      text: s.text,
      ...(s.cache ? { cache_control: { type: "ephemeral" as const, ttl: "1h" as const } } : {}),
    })),
    messages: [{ role: "user", content: opts.user }],
  } as Parameters<Anthropic["messages"]["create"]>[0]);

  const message = res as Anthropic.Message;

  if (message.stop_reason === "refusal") {
    throw new Error("El modelo declinó la petición.");
  }

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return { value: JSON.parse(text) as T, usage: readUsage(message) };
}
