import "server-only";
import { requireEnv } from "@/os/providers/config";
import type { MetaCta } from "@/os/repo/types";
import { normalizeEmail, normalizePhone } from "./normalize";

/**
 * Marketing API de Meta.
 *
 * Versión fijada: v26.0 (la actual desde el 29/07/2026). La v24 deja de estar disponible
 * el 06/10/2026, así que apuntar a v26 desde el principio evita una migración en un mes.
 */
export const API_VERSION = process.env.META_API_VERSION ?? "v26.0";
const GRAPH = `https://graph.facebook.com/${API_VERSION}`;

import { buildUrlTags } from "./utm";
export { buildUrlTags };

export type LaunchInput = {
  accessToken: string;
  adAccountId: string;   // act_...
  pageId: string;
  pixelId: string;
  campaignName: string;
  objective: "OUTCOME_LEADS" | "OUTCOME_TRAFFIC";
  dailyBudgetCents: number;
  geoKeys: string[];     // claves de geo_locations de Meta
  ageMin: number;
  ageMax: number;
  landingUrl: string;
  ads: {
    creativeId: string;
    primaryText: string;
    headline: string;
    description: string;
    cta: MetaCta;
    imageBytes: Uint8Array;
    imageName: string;
  }[];
};

/**
 * Lo que ya está creado. El job lo persiste tras CADA paso y lo vuelve a pasar al
 * reintentar, de modo que un fallo a mitad no deja campañas huérfanas en la cuenta del
 * cliente. Es la diferencia entre un reintento y un desastre visible para el cliente.
 */
export type LaunchProgress = {
  campaignId?: string;
  adsetId?: string;
  imageHashes?: Record<string, string>;
  creativeIds?: Record<string, string>;
  adIds?: Record<string, string>;
};

async function post<T>(path: string, token: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${GRAPH}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: token }),
    cache: "no-store",
  });
  const json = (await res.json()) as { error?: { message: string; code: number; error_subcode?: number } };
  if (!res.ok || json.error) {
    throw new MetaError(json.error?.message ?? res.statusText, json.error?.code, json.error?.error_subcode);
  }
  return json as T;
}

export class MetaError extends Error {
  constructor(message: string, readonly code?: number, readonly subcode?: number) {
    super(message);
    this.name = "MetaError";
  }
}

/** Los errores que una persona de marketing va a ver de verdad, en castellano. */
export function explainMetaError(e: MetaError): string {
  switch (e.code) {
    case 190: return "El acceso a la cuenta de Meta ha caducado. Vuelve a conectarla en Integraciones.";
    case 200: return "La app no tiene permiso sobre esta cuenta publicitaria. Revisa el acceso en Business Manager.";
    case 100:
      if (e.subcode === 1885183) return "Esta campaña necesita declarar una categoría especial (empleo, vivienda, crédito o política).";
      return `Meta ha rechazado los datos enviados: ${e.message}`;
    case 2635: return "Estás usando una versión de la API que Meta ya no admite.";
    case 1487390: return "El presupuesto diario está por debajo del mínimo que pide Meta para esta cuenta.";
    case 4:
    case 17: return "Meta ha limitado temporalmente las peticiones. Se reintentará solo en unos minutos.";
    default: return `Meta ha devuelto un error (${e.code ?? "?"}): ${e.message}`;
  }
}

/** Sube una imagen y devuelve su hash. Usa multipart, no JSON. */
async function uploadImage(
  accountId: string, token: string, name: string, bytes: Uint8Array,
): Promise<string> {
  const form = new FormData();
  form.append("access_token", token);
  form.append(name, new Blob([bytes as unknown as BlobPart]), name);
  const res = await fetch(`${GRAPH}/${accountId}/adimages`, { method: "POST", body: form, cache: "no-store" });
  const json = (await res.json()) as {
    images?: Record<string, { hash: string }>;
    error?: { message: string; code: number };
  };
  if (json.error) throw new MetaError(json.error.message, json.error.code);
  const hash = Object.values(json.images ?? {})[0]?.hash;
  if (!hash) throw new MetaError("Meta no ha devuelto el hash de la imagen");
  return hash;
}

/**
 * Crea campaña → conjunto → imágenes → creatividades → anuncios, todo en PAUSED.
 * Cada paso guarda su id antes del siguiente y se salta si ya lo tiene.
 */
export async function launchPaused(
  input: LaunchInput,
  progress: LaunchProgress,
  save: (p: LaunchProgress) => Promise<void>,
): Promise<LaunchProgress> {
  requireEnv("meta");
  const { accessToken: token, adAccountId: acct } = input;
  const p: LaunchProgress = { imageHashes: {}, creativeIds: {}, adIds: {}, ...progress };

  if (!p.campaignId) {
    const r = await post<{ id: string }>(`/${acct}/campaigns`, token, {
      name: input.campaignName,
      objective: input.objective,
      status: "PAUSED",
      special_ad_categories: [],
    });
    p.campaignId = r.id;
    await save(p);
  }

  if (!p.adsetId) {
    const r = await post<{ id: string }>(`/${acct}/adsets`, token, {
      name: `${input.campaignName} · conjunto`,
      campaign_id: p.campaignId,
      daily_budget: input.dailyBudgetCents,
      billing_event: "IMPRESSIONS",
      optimization_goal: input.objective === "OUTCOME_LEADS" ? "OFFSITE_CONVERSIONS" : "LINK_CLICKS",
      ...(input.objective === "OUTCOME_LEADS"
        ? { promoted_object: { pixel_id: input.pixelId, custom_event_type: "LEAD" } }
        : {}),
      targeting: {
        geo_locations: { cities: input.geoKeys.map((key) => ({ key })) },
        age_min: input.ageMin,
        age_max: input.ageMax,
      },
      status: "PAUSED",
    });
    p.adsetId = r.id;
    await save(p);
  }

  for (const ad of input.ads) {
    if (!p.imageHashes![ad.creativeId]) {
      p.imageHashes![ad.creativeId] = await uploadImage(acct, token, ad.imageName, ad.imageBytes);
      await save(p);
    }

    if (!p.creativeIds![ad.creativeId]) {
      const r = await post<{ id: string }>(`/${acct}/adcreatives`, token, {
        name: `${ad.headline} · ${ad.creativeId}`,
        object_story_spec: {
          page_id: input.pageId,
          link_data: {
            image_hash: p.imageHashes![ad.creativeId],
            link: input.landingUrl,
            message: ad.primaryText,
            name: ad.headline,
            description: ad.description,
            call_to_action: { type: ad.cta, value: { link: input.landingUrl } },
          },
        },
        url_tags: buildUrlTags(ad.creativeId),
      });
      p.creativeIds![ad.creativeId] = r.id;
      await save(p);
    }

    if (!p.adIds![ad.creativeId]) {
      const r = await post<{ id: string }>(`/${acct}/ads`, token, {
        name: ad.headline,
        adset_id: p.adsetId,
        creative: { creative_id: p.creativeIds![ad.creativeId] },
        status: "PAUSED",
      });
      p.adIds![ad.creativeId] = r.id;
      await save(p);
    }
  }

  return p;
}

// --- Conversions API -------------------------------------------------------

async function sha256Hex(v: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** La normalización vive en `normalize.ts` (pura, sin `server-only`) y se reexporta. */
export { normalizeEmail, normalizePhone } from "./normalize";

export type CapiEvent = {
  pixelId: string;
  accessToken: string;
  eventId: string;
  eventTime: number;
  sourceUrl: string;
  email?: string | null;
  phone?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

/** El `event_id` DEBE ser el mismo que el del píxel o Meta cuenta dos conversiones. */
export async function sendLeadEvent(e: CapiEvent): Promise<void> {
  const userData: Record<string, unknown> = {};
  if (e.email) userData.em = [await sha256Hex(normalizeEmail(e.email))];
  if (e.phone) userData.ph = [await sha256Hex(normalizePhone(e.phone))];
  if (e.fbc) userData.fbc = e.fbc;
  if (e.fbp) userData.fbp = e.fbp;
  if (e.ip) userData.client_ip_address = e.ip;
  if (e.userAgent) userData.client_user_agent = e.userAgent;

  await post(`/${e.pixelId}/events`, e.accessToken, {
    data: [
      {
        event_name: "Lead",
        event_time: e.eventTime,
        event_id: e.eventId,
        event_source_url: e.sourceUrl,
        action_source: "website",
        user_data: userData,
      },
    ],
  });
}
