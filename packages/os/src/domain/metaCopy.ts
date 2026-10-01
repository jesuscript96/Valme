/**
 * Longitudes de los campos de Meta.
 *
 * Son las RECOMENDADAS, no límites duros: pasarse no rompe la subida, recorta la vista
 * en el feed detrás de un "…ver más". Por eso la UI avisa en ámbar y no bloquea.
 *
 * Viven en una constante y no repartidas por el código porque Meta las cambia.
 */
export const META_LIMITS = {
  primaryText: 125,
  headline: 27,
  description: 27,
} as const;

export type CopyField = keyof typeof META_LIMITS;

export const FIELD_LABEL: Record<CopyField, string> = {
  primaryText: "Texto principal",
  headline: "Título",
  description: "Descripción",
};

export type LengthCheck = {
  field: CopyField;
  length: number;
  limit: number;
  over: boolean;
  /** Dónde cae el corte visible en el feed. */
  truncatedAt: number | null;
};

export function checkLength(field: CopyField, value: string): LengthCheck {
  const limit = META_LIMITS[field];
  const length = [...value].length;
  return {
    field,
    length,
    limit,
    over: length > limit,
    truncatedAt: length > limit ? limit : null,
  };
}

export function checkCopy(c: {
  primaryText: string;
  headline: string;
  description: string;
}): LengthCheck[] {
  return (Object.keys(META_LIMITS) as CopyField[]).map((f) => checkLength(f, c[f]));
}

/** Ángulos del MD, con la instrucción que recibe el modelo para cada uno. */
export const ANGLES = {
  pain: "Arranca del dolor concreto de la persona objetivo. Nómbralo con sus palabras, sin dramatizar ni culpabilizar.",
  benefit: "Arranca del resultado que consigue, en concreto y en su vida real. Nada de adjetivos de folleto.",
  social_proof: "Arranca de una prueba verificable del Brand Kit. Si no hay ninguna, dilo en vez de inventarla.",
  urgency: "Arranca de la razón real para actuar ahora (plazo, disponibilidad, condiciones). Si no la hay, no la inventes.",
  objection: "Arranca de la objeción que más frena y respóndela de frente en la primera línea.",
} as const;
