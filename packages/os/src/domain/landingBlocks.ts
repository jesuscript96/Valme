import { z } from "zod";

/**
 * ESQUEMA DE BLOQUES DE LA LANDING.
 *
 * Un único esquema sirve para tres cosas: validar lo que escribe el LLM, tipar el editor
 * y tipar el renderizador. Eso es exactamente lo que impide que se desincronicen — con
 * tres definiciones paralelas, a la tercera semana el editor guarda algo que el
 * renderizador no sabe pintar.
 *
 * No es un constructor libre: sólo existen estos siete bloques y no se pueden inventar
 * más. Menos libertad, siempre on-brand.
 */

const item = z.object({ title: z.string().min(1), body: z.string().min(1) });

export const HeroBlock = z.object({
  type: z.literal("hero"),
  headline: z.string().min(1),
  subheadline: z.string(),
  ctaLabel: z.string().min(1),
  imageAssetId: z.string().nullable(),
});

export const BenefitsBlock = z.object({
  type: z.literal("benefits"),
  title: z.string(),
  items: z.array(item).min(3).max(6),
});

export const HowBlock = z.object({
  type: z.literal("how"),
  title: z.string(),
  steps: z.array(item).min(2).max(4),
});

export const ProofBlock = z.object({
  type: z.literal("proof"),
  title: z.string(),
  quotes: z.array(z.object({ quote: z.string(), author: z.string() })).max(4),
  stats: z.array(z.object({ value: z.string(), label: z.string() })).max(4),
});

export const FaqBlock = z.object({
  type: z.literal("faq"),
  title: z.string(),
  items: z.array(z.object({ q: z.string(), a: z.string() })).min(3).max(8),
});

export const FormBlock = z.object({
  type: z.literal("form"),
  title: z.string(),
  subtitle: z.string(),
  submitLabel: z.string().min(1),
});

export const FooterBlock = z.object({
  type: z.literal("footer"),
  legalHtml: z.string(),
});

export const Block = z.discriminatedUnion("type", [
  HeroBlock, BenefitsBlock, HowBlock, ProofBlock, FaqBlock, FormBlock, FooterBlock,
]);

export const LandingDoc = z.object({
  blocks: z
    .array(z.object({ id: z.string(), visible: z.boolean(), block: Block }))
    .min(1),
});

export type Block = z.infer<typeof Block>;
export type LandingDoc = z.infer<typeof LandingDoc>;
export type BlockKind = Block["type"];

export const BLOCK_LABEL: Record<BlockKind, string> = {
  hero: "Portada",
  benefits: "Beneficios",
  how: "Cómo funciona",
  proof: "Prueba social",
  faq: "Preguntas frecuentes",
  form: "Formulario",
  footer: "Pie legal",
};

/** El formulario y el pie legal no se pueden ocultar: sin ellos no hay lead ni RGPD. */
export const REQUIRED_BLOCKS: BlockKind[] = ["form", "footer"];

export function canHide(kind: BlockKind): boolean {
  return !REQUIRED_BLOCKS.includes(kind);
}

/** Estructura de arranque cuando aún no se ha generado nada con el LLM. */
export function emptyDoc(offerName: string): LandingDoc {
  return {
    blocks: [
      { id: "b1", visible: true, block: { type: "hero", headline: offerName, subheadline: "", ctaLabel: "Pedir cita", imageAssetId: null } },
      { id: "b2", visible: true, block: { type: "benefits", title: "Por qué", items: [] as never } },
      { id: "b6", visible: true, block: { type: "form", title: "Escríbenos", subtitle: "", submitLabel: "Enviar" } },
      { id: "b7", visible: true, block: { type: "footer", legalHtml: "" } },
    ],
  };
}

/** Resumen de una línea de un bloque, para la lista del editor y la vista previa. */
export function blockSummary(b: Block): string {
  switch (b.type) {
    case "hero":     return b.headline;
    case "benefits": return b.items.map((i) => i.title).join(" · ") || "(sin beneficios)";
    case "how":      return b.steps.map((s) => s.title).join(" · ") || "(sin pasos)";
    case "proof":    return [...b.stats.map((s) => `${s.value} ${s.label}`), ...b.quotes.map((q) => `"${q.quote}"`)]
                              .join(" · ") || "(sin pruebas)";
    case "faq":      return `${b.items.length} preguntas`;
    case "form":     return b.subtitle || b.title;
    case "footer":   return b.legalHtml.replace(/<[^>]+>/g, "") || "(sin texto legal)";
  }
}

/** Lee un documento guardado. Devuelve null si no valida — el editor no pinta basura. */
export function readDoc(raw: unknown): LandingDoc | null {
  const r = LandingDoc.safeParse(raw);
  return r.success ? r.data : null;
}
