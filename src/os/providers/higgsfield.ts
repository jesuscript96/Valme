import "server-only";
import { requireEnv } from "./config";
import type { WebhookPayload } from "./higgsfield.pure";

/**
 * Cliente de Higgsfield.
 *
 * Dos endpoints, y la diferencia entre ellos decide el flujo entero:
 *   · `higgsfield-ai/soul/v2/standard` — SÓLO texto a imagen. NO acepta referencias.
 *   · `marketing-studio/image`         — acepta `image_urls` (hasta 16 en modo directo).
 *
 * Por eso, si el cliente aporta fotos, hay que usar Marketing Studio: con SOUL no hay
 * forma de pasárselas, por mucho que se describan en el prompt.
 *
 * Ninguno de los dos ofrece 4:5 — ver `domain/imageFormats.ts`.
 */

const BASE = "https://api.higgsfield.ai";

export const ENDPOINT = {
  "soul-2": "higgsfield-ai/soul/v2/standard",
  "marketing-studio": "marketing-studio/image",
} as const;

export type ImageModel = keyof typeof ENDPOINT;

function authHeader(): string {
  return `Key ${process.env.HF_API_KEY_ID}:${process.env.HF_API_KEY_SECRET}`;
}

export type Accepted = {
  status: "queued";
  request_id: string;
  status_url: string;
  cancel_url: string;
};

export type SoulInput = {
  prompt: string;
  aspect_ratio: "9:16" | "16:9" | "4:3" | "3:4" | "1:1" | "2:3" | "3:2";
  resolution?: "720p" | "1080p";
  style_id?: string;
  batch_size?: 1 | 4;
  enhance_prompt?: boolean;
  seed?: number;
};

export type MarketingStudioInput = {
  prompt: string;                 // 1 a 5.000 caracteres
  image_urls?: string[];          // HTTPS públicas
  resolution?: "1k" | "2k" | "4k";
  aspect_ratio?: "auto" | "1:1" | "3:2" | "2:3" | "4:3" | "3:4" | "16:9" | "9:16" | "21:9";
  quality?: "low" | "medium" | "high";
  moderation?: "auto" | "low";
  enhance_prompt?: boolean;
  preset_id?: string;
};

async function post<T>(path: string, body: unknown, query?: Record<string, string>): Promise<T> {
  requireEnv("higgsfield");
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Higgsfield ${path} → ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

/**
 * Coste ANTES de generar. Se llama con el mismo cuerpo que la petición real y se enseña
 * en la UI: "6 anuncios ≈ 1,13 $". Los estados `failed` y `nsfw` no se cobran y los
 * créditos reservados se devuelven solos.
 */
export async function estimate(
  model: ImageModel,
  input: SoulInput | MarketingStudioInput,
): Promise<{ credits: number; usd: number }> {
  const r = await post<{ credits: string; usd: string }>(`/estimate/${ENDPOINT[model]}`, input);
  return { credits: Number(r.credits), usd: Number(r.usd) };
}

/**
 * Lanza la generación con webhook. El `hf_webhook` va como parámetro de consulta,
 * URL-encoded.
 */
export async function generate(
  model: ImageModel,
  input: SoulInput | MarketingStudioInput,
  webhookUrl: string,
): Promise<Accepted> {
  return post<Accepted>(`/${ENDPOINT[model]}`, input, { hf_webhook: webhookUrl });
}

/** Red de seguridad: si la entrega del webhook se pierde, se consulta el estado. */
export async function fetchStatus(requestId: string): Promise<WebhookPayload> {
  requireEnv("higgsfield");
  const res = await fetch(`${BASE}/requests/${requestId}/status`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Higgsfield status ${requestId} → ${res.status}`);
  return (await res.json()) as WebhookPayload;
}

// --- Subida de referencias -------------------------------------------------

/**
 * Las fotos del cliente tienen que ser HTTPS públicas. En vez de abrir el bucket, se
 * suben aquí con el presignado de Higgsfield y se usa el `public_url` devuelto.
 * La URL de subida caduca en una hora.
 */
export async function uploadReference(bytes: Uint8Array, contentType: string): Promise<string> {
  const r = await post<{
    public_url: string;
    upload_url: string;
    upload_headers: Record<string, string>;
  }>("/files/generate-upload-url", { content_type: contentType });

  // Sin credenciales de Higgsfield: el presignado ya autoriza y mandarlas sería filtrarlas.
  const put = await fetch(r.upload_url, {
    method: "PUT",
    headers: r.upload_headers,
    body: bytes as unknown as BodyInit,
  });
  if (!put.ok) throw new Error(`Subida de referencia falló: ${put.status}`);

  return r.public_url;
}

// --- Webhook ---------------------------------------------------------------

/** La validación del envelope y las reglas de cobro viven en `higgsfield.pure.ts`. */
export {
  isTerminal, parseWebhook, costForTerminal,
  type TerminalStatus, type WebhookPayload,
} from "./higgsfield.pure";
