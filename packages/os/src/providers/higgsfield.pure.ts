/**
 * Parte pura del cliente de Higgsfield: validación del webhook y reglas de cobro.
 *
 * Separada de `higgsfield.ts` (que lleva `server-only` y hace red) porque es justo lo
 * que hay que poder probar sin llamar a nadie: el envelope que llega de fuera y la
 * decisión de cobrar o no.
 */

export type TerminalStatus = "completed" | "failed" | "nsfw";

export type WebhookPayload = {
  request_id: string;
  status: TerminalStatus | "queued" | "in_progress";
  error: string | null;
  payload?: { images?: { url: string; content_type: string }[] };
};

export function isTerminal(s: string): s is TerminalStatus {
  return s === "completed" || s === "failed" || s === "nsfw";
}

/**
 * Valida la forma del envelope. Un cuerpo que no encaje se rechaza con 4xx (Higgsfield
 * trata los 4xx como permanentes y no reintenta); un fallo nuestro devuelve 5xx para que
 * sí reintente durante las 2 horas siguientes.
 */
export function parseWebhook(raw: unknown): WebhookPayload | null {
  const b = raw as Partial<WebhookPayload> | null;
  if (!b || typeof b.request_id !== "string" || typeof b.status !== "string") return null;
  return {
    request_id: b.request_id,
    status: b.status,
    error: b.error ?? null,
    payload: b.payload,
  };
}

/** `nsfw` y `failed` no se cobran y los créditos reservados se devuelven solos. */
export function costForTerminal(status: TerminalStatus, estimated: number): number {
  return status === "completed" ? estimated : 0;
}
