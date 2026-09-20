import { after } from "next/server";
import { isRateLimited, parseSubmission } from "@/os/domain/leadIntake";

/**
 * INGESTA PÚBLICA DE LEADS.
 *
 * Endpoint único al que envía el formulario de cualquier landing. No pasa por la sesión
 * ni por RLS: valida el `landingId` él mismo y escribe con la clave de servicio.
 *
 * Qué se encola y qué no:
 *  - El evento de la Conversions API y el correo de confirmación van a la COLA
 *    (Trigger.dev, Sprint 3). `after()` existe en Next 16 y serviría para registrar, pero
 *    no reintenta y muere con la instancia. Un evento de conversión perdido descuadra la
 *    optimización de la campaña; un correo perdido es un lead que cree que su formulario
 *    no ha llegado. Ninguna de las dos cosas puede depender de que el proceso siga vivo.
 *  - `after()` sí vale para la traza, que se puede perder sin consecuencias.
 */
export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ ok: false, errors: { _: "Cuerpo inválido" } }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "desconocida";

  const landingId = String((raw as Record<string, unknown>)?.landingId ?? "");

  const result = parseSubmission(raw, {
    clientId: landingId,
    rateLimited: isRateLimited(`${ip}:${landingId}`),
  });

  if (!result.ok) {
    // El honeypot devuelve 200: al bot no se le dice que lo hemos pillado.
    return Response.json(
      result.status === 200 ? { ok: true } : { ok: false, errors: result.errors },
      { status: result.status },
    );
  }

  after(() => {
    console.info("[lead] recibido", {
      landingId: result.lead.landingId,
      eventId: result.lead.eventId,
      hasEmail: Boolean(result.lead.emailNormalized),
    });
  });

  // TODO Sprint 3: UPSERT en `leads` y encolar `lead.capi` + `lead.confirmation-email`.
  return Response.json({ ok: true, eventId: result.lead.eventId }, { status: 200 });
}
