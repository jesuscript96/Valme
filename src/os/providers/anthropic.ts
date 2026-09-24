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

/**
 * Configuración del proveedor, en el espacio de nombres de la aplicación.
 *
 * Se usan `OS_LLM_*` y no `ANTHROPIC_*` a propósito: un entorno de desarrollo puede
 * tener ya sus propias credenciales de Anthropic exportadas, y entonces pisan al fichero
 * de configuración sin avisar. Pasó exactamente eso montando esto. Con nombre propio,
 * la configuración de la aplicación es explícita y nadie se la puede pisar por accidente.
 */
export const BASE_URL = process.env.OS_LLM_BASE_URL ?? undefined;
const API_KEY = () => process.env.OS_LLM_API_KEY ?? process.env.ANTHROPIC_API_KEY;

export { costUsd };
export type { Usage };

let cached: Anthropic | null = null;
export function anthropic(): Anthropic {
  requireEnv("anthropic");
  cached ??= new Anthropic({
    apiKey: API_KEY(),
    ...(BASE_URL ? { baseURL: BASE_URL } : {}),
  });
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
 * ¿Hablamos con Anthropic de verdad?
 *
 * DeepSeek y Z.ai exponen el protocolo de mensajes de Anthropic, pero su capa de
 * compatibilidad NO implementa `output_config.format`: lo aceptan y lo ignoran en
 * silencio, que es peor que rechazarlo. Comprobado contra Z.ai el 24/09/2026.
 *
 * Por eso hay dos modos de salida estructurada y se elige solo según a dónde apunta el
 * cliente.
 */
const esAnthropic = () => !BASE_URL || BASE_URL.includes("api.anthropic.com");

const SISTEMA_JSON =
  "Devuelves SOLO un objeto JSON válido que cumpla exactamente el esquema indicado. " +
  "Sin explicaciones, sin comentarios, sin markdown y sin vallas de código. " +
  "Empiezas por { y terminas por }.";

/** Saca el objeto JSON de una respuesta que puede venir con vallas o con texto alrededor. */
function extraerJson(texto: string): unknown {
  const limpio = texto.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(limpio);
  } catch {
    // Último recurso: el primer objeto equilibrado que aparezca.
    const i = limpio.indexOf("{");
    if (i === -1) throw new Error("La respuesta no contiene ningún objeto JSON");
    let nivel = 0;
    for (let j = i; j < limpio.length; j++) {
      if (limpio[j] === "{") nivel++;
      else if (limpio[j] === "}" && --nivel === 0) {
        return JSON.parse(limpio.slice(i, j + 1));
      }
    }
    throw new Error("El objeto JSON de la respuesta está incompleto");
  }
}

/**
 * Una llamada con salida estructurada. Devuelve el JSON ya parseado más el uso.
 *
 * `system` se pasa como bloques para poder marcar el prefijo estable con
 * `cache_control`: el Brand Kit renderizado es idéntico entre ángulos y entre ediciones,
 * así que a partir de la segunda llamada esa parte se paga a ~0,1×. Lo estable primero,
 * lo volátil después — es la única regla que hace que la caché funcione.
 *
 * Con un proveedor que no sea Anthropic, el esquema va en el mensaje y la respuesta se
 * extrae y se valida. Reintenta una vez con el error delante: los modelos corrigen bien
 * cuando se les dice qué han roto.
 */
export async function structured<T>(opts: {
  system: { text: string; cache?: boolean }[];
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
}): Promise<{ value: T; usage: Usage }> {
  const nativo = esAnthropic();

  const bloquesSistema = [
    ...opts.system,
    ...(nativo ? [] : [{ text: SISTEMA_JSON }]),
  ].map((s) => ({
    type: "text" as const,
    text: s.text,
    ...(s.cache ? { cache_control: { type: "ephemeral" as const, ttl: "1h" as const } } : {}),
  }));

  const usuario = nativo
    ? opts.user
    : `${opts.user}\n\nDevuelve un JSON que cumpla este esquema:\n${JSON.stringify(opts.schema)}`;

  const llamar = async (mensajeUsuario: string) => {
    const body: Record<string, unknown> = {
      model: MODEL,
      max_tokens: opts.maxTokens ?? 16_000,
      system: bloquesSistema,
      messages: [{ role: "user", content: mensajeUsuario }],
    };
    if (nativo) {
      body.thinking = { type: "adaptive" };
      body.output_config = {
        effort: opts.effort ?? "high",
        format: { type: "json_schema", schema: opts.schema },
      };
    }
    const res = await anthropic().messages.create(
      body as unknown as Parameters<Anthropic["messages"]["create"]>[0],
    );
    return res as Anthropic.Message;
  };

  let message = await llamar(usuario);
  if (message.stop_reason === "refusal") throw new Error("El modelo declinó la petición.");

  const texto = (m: Anthropic.Message) =>
    m.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");

  let uso = readUsage(message);

  try {
    return { value: extraerJson(texto(message)) as T, usage: uso };
  } catch (e) {
    // Un reintento con el error delante. Más de uno no arregla nada y multiplica el coste.
    message = await llamar(
      `${usuario}\n\nTu respuesta anterior no se pudo interpretar: ${
        e instanceof Error ? e.message : String(e)
      }\nDevuelve únicamente el objeto JSON.`,
    );
    const u2 = readUsage(message);
    uso = {
      inputTokens: uso.inputTokens + u2.inputTokens,
      outputTokens: uso.outputTokens + u2.outputTokens,
      cacheReadTokens: uso.cacheReadTokens + u2.cacheReadTokens,
      cacheWriteTokens: uso.cacheWriteTokens + u2.cacheWriteTokens,
    };
    return { value: extraerJson(texto(message)) as T, usage: uso };
  }
}
