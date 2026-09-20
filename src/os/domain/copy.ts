import "server-only";
import { structured } from "@/os/providers/anthropic";
import { ANGLES } from "./metaCopy";
import type { Angle, BrandKit, MetaCta, Offer } from "@/os/repo/types";

/**
 * GENERACIÓN DE COPYS.
 *
 * Una llamada POR ÁNGULO, en paralelo. Tres razones, todas prácticas:
 *  · regenerar un ángulo no tira los otros dos,
 *  · las tres comparten el mismo prefijo cacheado (Brand Kit + oferta),
 *  · un fallo afecta a un tercio, no a todo.
 */

const CTA_VALUES: MetaCta[] = [
  "LEARN_MORE", "SIGN_UP", "GET_QUOTE", "CONTACT_US", "BOOK_NOW", "DOWNLOAD",
];

export const COPY_SYSTEM = `Escribes anuncios de Meta en español de España para pymes. Trabajas con el Brand Kit y la oferta que te dan, y no te sales de ahí.

Reglas:

1. NO INVENTES DATOS. Cifras, plazos, precios, testimonios y garantías sólo si están en el Brand Kit o en la oferta. Si un ángulo pide una prueba que no existe, escribe el anuncio sin ella en vez de fabricarla.
2. RESPETA LA VOZ. Los adjetivos de tono, el tuteo o el usted, y las palabras a evitar del Brand Kit no son sugerencias.
3. LA PRIMERA LÍNEA SE LEE SOLA. En el feed se ve aproximadamente el primer renglón y medio antes del "ver más". Que esa parte funcione por sí misma.
4. NADA DE RELLENO DE FOLLETO. "Soluciones integrales", "calidad y excelencia", "tu mejor aliado": fuera. Concreto siempre por encima de grandilocuente.
5. El título tiende a 27 caracteres y la descripción también; el texto principal, a 125. Son recomendaciones de Meta, no límites: pásate sólo si el texto lo pide de verdad.
6. Sin emojis salvo que el Brand Kit los use en sus ejemplos de copy.`;

export function renderBrandKit(kit: BrandKit): string {
  const b = kit.business;
  const list = (xs: { value: string }[]) => xs.map((x) => `- ${x.value}`).join("\n") || "- (ninguno)";
  return `<brand_kit>
Voz: ${kit.voice.tone.join(", ")} · trato de ${kit.voice.address === "usted" ? "usted" : "tú"}
Palabras a usar: ${kit.voice.wordsToUse.join(", ") || "(sin preferencia)"}
Palabras a evitar: ${kit.voice.wordsToAvoid.join(", ") || "(ninguna)"}
Ejemplos de su copy real:
${kit.voice.sampleCopy.map((s) => `- "${s}"`).join("\n") || "- (ninguno)"}

Propuesta de valor: ${b.valueProposition?.value ?? "(sin definir)"}
Servicios:
${list(b.services)}
Diferenciales:
${list(b.differentiators)}
Pruebas verificables (SÓLO puedes citar estas):
${list(b.proof)}
Zona: ${b.geo ?? "(sin definir)"}

Personas:
${kit.personas
  .map(
    (p, i) => `${i + 1}. ${p.profile}
   dolores: ${p.pains.join("; ")}
   deseos: ${p.desires.join("; ")}
   objeciones: ${p.objections.join("; ")}`,
  )
  .join("\n") || "(sin definir)"}
</brand_kit>`;
}

export function renderOffer(offer: Offer, kit: BrandKit): string {
  const persona = offer.personaIndex !== null ? kit.personas[offer.personaIndex] : null;
  return `<oferta>
Nombre: ${offer.name}
Qué se ofrece: ${offer.what}
Gancho: ${offer.hook ?? "(ninguno)"}
Persona objetivo: ${persona?.profile ?? "(toda la audiencia)"}
Llamada a la acción: ${offer.cta}
${offer.endsAt ? `Termina el: ${offer.endsAt}` : "Sin fecha de fin — NO uses urgencia por plazo."}
</oferta>`;
}

const VARIANTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["variants"],
  properties: {
    variants: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["primaryText", "headline", "description", "cta"],
        properties: {
          primaryText: { type: "string", minLength: 20, maxLength: 600 },
          headline: { type: "string", minLength: 3, maxLength: 60 },
          description: { type: "string", minLength: 3, maxLength: 60 },
          cta: { enum: CTA_VALUES },
        },
      },
    },
  },
} as const;

export type GeneratedVariant = {
  primaryText: string;
  headline: string;
  description: string;
  cta: MetaCta;
};

/**
 * El bloque estable (system + Brand Kit + oferta) va marcado para caché: ronda los 2–4k
 * tokens y es idéntico entre los tres ángulos y entre todas las ediciones por tarjeta de
 * esa sesión. A partir de la segunda llamada esa parte se paga a ~0,1×. Lo estable
 * primero, lo volátil después: es toda la regla.
 */
export async function generateAngle(
  kit: BrandKit,
  offer: Offer,
  angle: Angle,
  variants: number,
) {
  return structured<{ variants: GeneratedVariant[] }>({
    system: [
      { text: COPY_SYSTEM },
      { text: `${renderBrandKit(kit)}\n\n${renderOffer(offer, kit)}`, cache: true },
    ],
    user: `Ángulo: ${ANGLES[angle]}\n\nEscribe ${variants} variantes distintas entre sí, no reformulaciones de la misma idea.`,
    schema: VARIANTS_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 4_000,
  });
}

export const REFINEMENTS = {
  shorter: "Recórtalo. Misma idea, menos palabras. El texto principal por debajo de 125 caracteres y el título por debajo de 27.",
  sharper: "Hazlo más directo: quita rodeos y adjetivos, ve al grano en la primera línea.",
  regenerate: "Escribe una variante distinta para el mismo ángulo. Otro enfoque, no una reformulación.",
} as const;

export async function refineVariant(
  kit: BrandKit,
  offer: Offer,
  current: GeneratedVariant,
  how: keyof typeof REFINEMENTS,
) {
  return structured<{ variants: GeneratedVariant[] }>({
    system: [
      { text: COPY_SYSTEM },
      { text: `${renderBrandKit(kit)}\n\n${renderOffer(offer, kit)}`, cache: true },
    ],
    user: `Anuncio actual:\n${JSON.stringify(current, null, 2)}\n\n${REFINEMENTS[how]}\n\nDevuelve exactamente una variante.`,
    schema: VARIANTS_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 2_000,
    effort: "medium",
  });
}
