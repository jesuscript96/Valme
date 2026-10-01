import { z } from "zod";
import { normalizeEmail, normalizePhone } from "./normalize";

/**
 * INGESTA DE LEADS.
 *
 * La lógica pura, separada del route handler, para poder probarla sin levantar nada.
 * El orden de los pasos importa y está fijado en `parseSubmission`:
 *
 *   1. límite de peticiones   → 429
 *   2. honeypot relleno       → 200 y a la basura, sin pista para el bot
 *   3. validación             → 422 con errores por campo
 *   4. normalización          → email en minúsculas, teléfono a E.164
 *   5. deduplicación          → por (client_id, email normalizado)
 *
 * La normalización va ANTES del hash de la CAPI. Un email sin pasar a minúsculas produce
 * otro hash y la atribución se pierde en silencio, sin error visible en ninguna parte.
 */

export const HONEYPOT_FIELD = "company_website";

export const SubmissionSchema = z.object({
  landingId: z.string().min(1),
  name: z.string().trim().min(1, "Dinos tu nombre").max(120),
  email: z.string().trim().email("Revisa el email").max(200).optional().or(z.literal("")),
  phone: z.string().trim().min(6, "Revisa el teléfono").max(30).optional().or(z.literal("")),
  answers: z.record(z.string(), z.string().max(500)).default({}),
  consent: z.literal(true, { message: "Hay que aceptar la política de privacidad" }),
  utm_source: z.string().max(120).nullish(),
  utm_medium: z.string().max(120).nullish(),
  utm_campaign: z.string().max(200).nullish(),
  utm_content: z.string().max(200).nullish(),
  utm_term: z.string().max(200).nullish(),
  fbclid: z.string().max(400).nullish(),
  fbp: z.string().max(200).nullish(),
  fbc: z.string().max(400).nullish(),
});

export type Submission = z.infer<typeof SubmissionSchema>;

export type IntakeResult =
  | { ok: true; lead: NormalizedLead }
  | { ok: false; status: 422; errors: Record<string, string> }
  | { ok: false; status: 429; errors: Record<string, string> }
  | { ok: false; status: 200; errors: Record<string, string> }; // honeypot

export type NormalizedLead = Submission & {
  emailNormalized: string | null;
  phoneNormalized: string | null;
  dedupeKey: string | null;
  eventId: string;
};

/** Al menos una vía de contacto: un lead sin email ni teléfono no sirve para nada. */
function hasContact(s: { email?: string; phone?: string }): boolean {
  return Boolean(s.email?.trim() || s.phone?.trim());
}

export function parseSubmission(
  raw: unknown,
  opts: { clientId: string; rateLimited: boolean },
): IntakeResult {
  if (opts.rateLimited) {
    return { ok: false, status: 429, errors: { _: "Demasiados envíos. Prueba en un minuto." } };
  }

  const body = (raw ?? {}) as Record<string, unknown>;

  // Honeypot: campo oculto que una persona nunca rellena. Devolvemos 200 para no
  // decirle al bot que lo hemos detectado — si lo supiera, probaría sin él.
  if (typeof body[HONEYPOT_FIELD] === "string" && body[HONEYPOT_FIELD].length > 0) {
    return { ok: false, status: 200, errors: {} };
  }

  const parsed = SubmissionSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".") || "_"] = issue.message;
    }
    return { ok: false, status: 422, errors };
  }

  if (!hasContact(parsed.data)) {
    return { ok: false, status: 422, errors: { email: "Necesitamos un email o un teléfono" } };
  }

  const emailNormalized = parsed.data.email ? normalizeEmail(parsed.data.email) : null;
  const phoneNormalized = parsed.data.phone ? normalizePhone(parsed.data.phone) : null;

  return {
    ok: true,
    lead: {
      ...parsed.data,
      emailNormalized,
      phoneNormalized,
      // Preferimos el email: es lo que Meta deduplica mejor y lo que usa el correo.
      dedupeKey: emailNormalized
        ? `${opts.clientId}:${emailNormalized}`
        : phoneNormalized
          ? `${opts.clientId}:${phoneNormalized}`
          : null,
      eventId: crypto.randomUUID(),
    },
  };
}

/** Ventana deslizante en memoria. En producción, Upstash o un contador en Postgres. */
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, max = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}
