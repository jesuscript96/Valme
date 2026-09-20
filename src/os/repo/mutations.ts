"use server";

import { revalidatePath } from "next/cache";
import { forClient } from "./index";
import * as seed from "./seed.data";
import type { Angle, CreativeStatus, MetaCta } from "./types";

/**
 * ESCRITURAS.
 *
 * Mutan el seed EN MEMORIA: se pierden al reiniciar el servidor. Existen para que el
 * flujo se pueda recorrer entero antes de que haya base de datos — aprobar un kit, crear
 * una oferta, aprobar anuncios, publicar la landing.
 *
 * Cada una de estas funciones es la que en el Sprint 1 pasa a ser un UPDATE contra
 * Supabase. La firma, la autorización y la revalidación no cambian: sólo el cuerpo.
 *
 * La autorización se comprueba AQUÍ, en cada acción. Un Server Action es un endpoint
 * público con otro nombre, y esconder el botón no protege nada.
 */

type Result = { ok: true } | { ok: false; error: string };

// --- Brand Kit -------------------------------------------------------------

export async function approveBrandKit(slug: string): Promise<Result> {
  const scope = await forClient(slug);
  if (scope.role === "operator") return { ok: false, error: "Un ejecutor no puede aprobar el kit." };

  const kit = seed.brandKits.find((k) => k.clientId === scope.client.id);
  if (!kit) return { ok: false, error: "No hay Brand Kit." };
  if (kit.status === "extracting") {
    return { ok: false, error: "Todavía se está extrayendo." };
  }

  kit.status = "approved";
  kit.version += 1;               // en Supabase, además, snapshot en brand_kit_versions
  kit.approvedAt = new Date().toISOString();
  kit.approvedBy = scope.member.id;

  revalidatePath(`/app/c/${slug}`, "layout");
  return { ok: true };
}

// --- Ofertas ---------------------------------------------------------------

export async function createOffer(
  slug: string,
  input: { name: string; what: string; hook: string; cta: MetaCta; personaIndex: number | null },
): Promise<Result> {
  const scope = await forClient(slug);
  const kit = await scope.brandKit();

  // La precondición se comprueba en el servidor, no sólo deshabilitando el botón.
  if (kit.status !== "approved") {
    return { ok: false, error: "El Brand Kit tiene que estar aprobado antes." };
  }
  if (!input.name.trim() || !input.what.trim()) {
    return { ok: false, error: "El nombre y qué se ofrece son obligatorios." };
  }

  seed.offers.push({
    id: `of_${crypto.randomUUID().slice(0, 8)}`,
    clientId: scope.client.id,
    brandKitId: kit.id,
    name: input.name.trim(),
    what: input.what.trim(),
    hook: input.hook.trim() || null,
    personaIndex: input.personaIndex,
    cta: input.cta,
    endsAt: null,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/app/c/${slug}`, "layout");
  return { ok: true };
}

// --- Creatividades ---------------------------------------------------------

export async function setCreativeStatus(
  slug: string,
  creativeId: string,
  status: CreativeStatus,
): Promise<Result> {
  const scope = await forClient(slug);
  const c = seed.adCreatives.find((x) => x.id === creativeId && x.clientId === scope.client.id);
  if (!c) return { ok: false, error: "Anuncio no encontrado." };

  // Un anuncio ya subido a Meta no se puede volver a tocar desde aquí.
  if (c.metaAdId && status === "discarded") {
    return { ok: false, error: "Este anuncio ya existe en Meta. Descártalo en Ads Manager." };
  }

  c.status = status;
  revalidatePath(`/app/c/${slug}`, "layout");
  return { ok: true };
}

/** Genera el tablero de anuncios. Sin credenciales, dice qué falta en vez de fingir. */
export async function generateCreatives(
  slug: string,
  offerId: string,
  opts: { angles: Angle[]; variants: number },
): Promise<Result> {
  const scope = await forClient(slug);
  const offer = await scope.offers.get(offerId);
  if (!offer) return { ok: false, error: "Oferta no encontrada." };

  const { isConfigured, missingEnv } = await import("@/os/providers/config");
  if (!isConfigured("anthropic")) {
    return { ok: false, error: `Falta configurar: ${missingEnv("anthropic").join(", ")}` };
  }

  const kit = await scope.brandKit();
  const { generateAngle } = await import("@/os/domain/copy");

  // Un ángulo por llamada, en paralelo: regenerar uno no tira los otros y las tres
  // comparten el prefijo cacheado (Brand Kit + oferta).
  const results = await Promise.allSettled(
    opts.angles.map((angle) => generateAngle(kit, offer, angle, opts.variants)),
  );

  results.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    r.value.value.variants.forEach((v, j) => {
      seed.adCreatives.push({
        id: `ac_${crypto.randomUUID().slice(0, 8)}`,
        clientId: scope.client.id,
        offerId,
        angle: opts.angles[i],
        variant: j + 1,
        primaryText: v.primaryText,
        headline: v.headline,
        description: v.description,
        cta: v.cta,
        masterAssetId: null,
        status: "generated",
        metaAdId: null,
        createdAt: new Date().toISOString(),
      });
    });
  });

  const failed = results.filter((r) => r.status === "rejected").length;
  revalidatePath(`/app/c/${slug}`, "layout");

  return failed === 0
    ? { ok: true }
    : { ok: false, error: `${failed} de ${opts.angles.length} ángulos han fallado. Los demás están arriba.` };
}

// --- Landings --------------------------------------------------------------

export async function publishLanding(slug: string, landingId: string): Promise<Result> {
  const scope = await forClient(slug);
  const l = seed.landings.find((x) => x.id === landingId && x.clientId === scope.client.id);
  if (!l) return { ok: false, error: "Landing no encontrada." };

  if (!l.emailTemplate) {
    return { ok: false, error: "Redacta y aprueba antes el correo de confirmación." };
  }

  // Publicar es copiar el borrador a lo publicado: mientras editas, la página viva
  // no cambia. El renderizador sólo lee `publishedBlocks`.
  l.publishedBlocks = l.blocks;
  l.status = "published";
  l.publishedAt = new Date().toISOString();

  // En el Sprint 3 esto además llama a revalidateTag('landing:<tenant>:<slug>')
  // en la app de landings.
  revalidatePath(`/app/c/${slug}`, "layout");
  return { ok: true };
}
