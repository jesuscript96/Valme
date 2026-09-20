import "server-only";
import {
  mapSite, pickRelevantPages, scrapeBranding, scrapeMarkdown, type FirecrawlBranding,
} from "@/os/providers/firecrawl";
import { structured } from "@/os/providers/anthropic";
import type { Business, Identity, Legal, Persona, Voice } from "@/os/repo/types";

/**
 * EXTRACCIÓN DEL BRAND KIT.
 *
 * Dos pasos deliberadamente separados:
 *  1. Identidad visual — mapeo directo de `branding` de Firecrawl. Sin LLM: son datos
 *     medidos de la página, no una interpretación. Meterlos por un modelo sólo añadiría
 *     ruido y coste.
 *  2. Mensaje — una llamada a Claude con el markdown de hasta 6 páginas.
 */

// --- Paso 1: identidad (determinista) --------------------------------------

export function brandingToIdentity(b: FirecrawlBranding | null): Identity {
  const logo = b?.logo ?? b?.images?.logo ?? null;
  return {
    logoLightPath: logo,
    logoDarkPath: null,
    colors: {
      primary: b?.colors?.primary ?? null,
      secondary: b?.colors?.secondary ?? null,
      accent: b?.colors?.accent ?? null,
      background: b?.colors?.background ?? null,
      textPrimary: b?.colors?.textPrimary ?? null,
    },
    fonts: {
      heading: b?.typography?.fontFamilies?.heading ?? b?.fonts?.[0]?.family ?? null,
      body: b?.typography?.fontFamilies?.primary ?? b?.fonts?.[1]?.family ?? null,
    },
    colorScheme: b?.colorScheme ?? null,
    borderRadius: b?.spacing?.borderRadius ?? null,
    photoStyle: null,
    imageModel: null, // lo fija §4.1: depende de si el cliente aporta fotos
  };
}

/**
 * `branding.personality` da tono, energía y público objetivo leídos del sitio real.
 * No sustituye la revisión humana, pero es un punto de partida que no es inventado.
 */
export function personalitySeed(b: FirecrawlBranding | null): string | null {
  const p = b?.personality;
  if (!p) return null;
  const parts = [
    p.tone && `tono ${p.tone}`,
    p.energy && `energía ${p.energy}`,
    p.targetAudience && `público ${p.targetAudience}`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

// --- Paso 2: mensaje (LLM) -------------------------------------------------

const sourced = {
  type: "object",
  additionalProperties: false,
  required: ["value", "sourceUrl"],
  properties: { value: { type: "string" }, sourceUrl: { type: ["string", "null"] } },
} as const;

export const MESSAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["voice", "business", "personas", "legal"],
  properties: {
    voice: {
      type: "object",
      additionalProperties: false,
      required: ["tone", "address", "wordsToUse", "wordsToAvoid", "sampleCopy"],
      properties: {
        tone: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
        address: { enum: ["tu", "usted"] },
        wordsToUse: { type: "array", items: { type: "string" }, maxItems: 10 },
        wordsToAvoid: { type: "array", items: { type: "string" }, maxItems: 10 },
        sampleCopy: { type: "array", items: { type: "string" }, maxItems: 4 },
      },
    },
    business: {
      type: "object",
      additionalProperties: false,
      required: ["valueProposition", "services", "differentiators", "proof", "geo"],
      properties: {
        valueProposition: sourced,
        services: { type: "array", items: sourced, maxItems: 10 },
        differentiators: { type: "array", items: sourced, maxItems: 6 },
        proof: { type: "array", items: sourced, maxItems: 8 },
        geo: { type: ["string", "null"] },
      },
    },
    personas: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["profile", "pains", "desires", "objections"],
        properties: {
          profile: { type: "string" },
          pains: { type: "array", items: { type: "string" }, maxItems: 5 },
          desires: { type: "array", items: { type: "string" }, maxItems: 5 },
          objections: { type: "array", items: { type: "string" }, maxItems: 5 },
        },
      },
    },
    legal: {
      type: "object",
      additionalProperties: false,
      required: ["privacyUrl", "controller", "consentText"],
      properties: {
        privacyUrl: { type: ["string", "null"] },
        controller: { type: ["string", "null"] },
        consentText: { type: ["string", "null"] },
      },
    },
  },
} as const;

export const EXTRACTION_SYSTEM = `Eres analista de marca. A partir del contenido real de la web de una empresa, rellenas su Brand Kit para que un equipo de marketing genere anuncios y landings on-brand.

Reglas que no se negocian:

1. NO INVENTES PRUEBAS. Cifras, premios, número de clientes, años de experiencia, testimonios y logos sólo si aparecen literalmente en el contenido. Si no hay ninguna, devuelve "proof" como array vacío. Una prueba social inventada acaba en un anuncio pagado y es un problema legal del cliente, no un detalle de estilo.

2. CITA EL ORIGEN. Cada elemento con "sourceUrl" lleva la URL exacta de la página donde lo has leído. Si no puedes señalar una, pon null — y entonces el equipo sabrá que hay que comprobarlo.

3. EL TONO SE DESCRIBE, NO SE DESEA. Los tres adjetivos de "tone" describen cómo escribe ESTA empresa hoy, no cómo debería escribir.

4. "wordsToAvoid" son palabras que la empresa evita o que chocarían con su registro, deducidas de cómo escribe. No una lista genérica de tópicos de marketing.

5. "sampleCopy" son frases copiadas literalmente de la web que representen bien su voz. Literales, no reescritas.

6. Escribe en español de España, tuteando o de usted según lo que haga la propia web.`;

export type MessageExtraction = {
  voice: Voice;
  business: Business;
  personas: Persona[];
  legal: Omit<Legal, "capiLegalBasis">;
};

export function buildExtractionContext(
  pages: { url: string; markdown: string }[],
  branding: FirecrawlBranding | null,
): string {
  const seed = personalitySeed(branding);
  const head = seed
    ? `Señal automática de la identidad visual del sitio (úsala como pista, no como verdad): ${seed}.\n\n`
    : "";
  const body = pages
    .filter((p) => p.markdown.trim().length > 40)
    .map((p) => `<pagina url="${p.url}">\n${p.markdown.slice(0, 20_000)}\n</pagina>`)
    .join("\n\n");
  return `${head}Contenido de la web:\n\n${body}`;
}

/** Pipeline completo. Devuelve también las páginas leídas para poder auditarlo. */
export async function extractBrandKit(homeUrl: string) {
  const { branding, markdown: homeMd } = await scrapeBranding(homeUrl);

  let links: string[] = [];
  try {
    links = await mapSite(homeUrl);
  } catch {
    // El mapa es un extra: si falla, seguimos con la home. No merece abortar la extracción.
  }
  const urls = pickRelevantPages(homeUrl, links);

  const pages = [{ url: homeUrl, markdown: homeMd }];
  for (const url of urls.slice(1)) {
    try {
      pages.push({ url, markdown: await scrapeMarkdown(url) });
    } catch {
      // Una página caída no invalida el resto.
    }
  }

  const { value, usage } = await structured<MessageExtraction>({
    system: [{ text: EXTRACTION_SYSTEM, cache: true }],
    user: buildExtractionContext(pages, branding),
    schema: MESSAGE_SCHEMA as unknown as Record<string, unknown>,
  });

  return {
    identity: brandingToIdentity(branding),
    ...value,
    pagesRead: pages.map((p) => p.url),
    branding,
    usage,
  };
}
