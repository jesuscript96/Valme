import { isTerminal, parseWebhook } from "@/os/providers/higgsfield";

/**
 * WEBHOOK DE HIGGSFIELD.
 *
 * Cuatro reglas que impone la documentación y que, si se ignoran, fallan en producción:
 *
 *  1. DIEZ SEGUNDOS. El endpoint tiene que responder en menos de 10 s. Por eso aquí NO
 *     se descarga nada: las imágenes pesan y la descarga va a un job aparte.
 *  2. DUPLICADOS GARANTIZADOS. Se deduplica por `request_id` + estado terminal, con un
 *     índice único en `ai_jobs (provider, external_id)`. Una segunda entrega responde
 *     2xx y no hace nada.
 *  3. REINTENTOS HASTA 2 HORAS ante 5xx o fallo de red; un 4xx es permanente. Así que un
 *     cuerpo con forma inválida devuelve 400 (no queremos que lo reintente 2 h) y un
 *     fallo nuestro devuelve 500 (sí queremos).
 *  4. SIETE DÍAS DE RETENCIÓN. El job de descarga copia a Storage inmediatamente: al
 *     octavo día el enlace desaparece y el anuncio se queda sin imagen.
 */
export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response("Cuerpo inválido", { status: 400 });
  }

  const hook = parseWebhook(raw);
  if (!hook) return new Response("Envelope no reconocido", { status: 400 });

  if (!isTerminal(hook.status)) {
    // Estado intermedio: se acepta y se ignora.
    return Response.json({ ok: true, ignored: hook.status });
  }

  try {
    // TODO Sprint 2, dentro de una transacción:
    //   1. UPDATE ai_jobs SET status, error, cost_usd WHERE external_id = hook.request_id
    //      AND status NOT IN ('succeeded','failed')   ← esto es lo que hace idempotente
    //   2. si completed: encolar `image.download` con hook.payload.images
    //   3. si nsfw/failed: cost_usd = 0 (Higgsfield no cobra esos estados)
    console.info("[higgsfield] terminal", {
      requestId: hook.request_id,
      status: hook.status,
      images: hook.payload?.images?.length ?? 0,
      error: hook.error,
    });

    return Response.json({ ok: true });
  } catch (e) {
    // 500 para que Higgsfield reintente durante las próximas 2 horas.
    console.error("[higgsfield] fallo al registrar", e);
    return new Response("Error interno", { status: 500 });
  }
}
