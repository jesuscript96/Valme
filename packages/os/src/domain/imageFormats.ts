/** Los cuatro formatos del MVP. Duplicado a propósito de `repo/types` para que
 * este módulo sea puro y comprobable sin arrastrar el modelo entero. */
export type AdFormat = "3:4" | "4:5" | "1:1" | "9:16";

/**
 * FORMATOS DE ANUNCIO.
 *
 * Corrección a la especificación original: NINGÚN modelo de Higgsfield ofrece 4:5, que
 * es el formato de feed que pide el MVP.
 *   · SOUL / SOUL 2:      9:16, 16:9, 4:3, 3:4, 1:1, 2:3, 3:2
 *   · Marketing Studio:   auto, 1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16, 21:9
 *
 * Así que se generan DOS imágenes y se derivan las otras dos por recorte central:
 *
 *   3:4  (1080×1440)  ─┬─→ 4:5 (1080×1350)   pierde  6,25 %
 *                      └─→ 1:1 (1080×1080)   pierde 25 %
 *   9:16 (1080×1920)  ────→ stories/reels, tal cual
 *
 * Dos generaciones, cuatro entregables: un tercio menos de coste que generar cada
 * formato por separado, y encuadres coherentes entre sí porque salen de la misma imagen.
 */

export const MASTER_WIDTH = 1080;

/** Alto en píxeles de cada formato a 1080 de ancho. */
export const FORMAT_SIZE: Record<AdFormat, { width: number; height: number }> = {
  "3:4": { width: 1080, height: 1440 },
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

/** Ratios que sí admite la API, por modelo. 4:5 no está en ninguno. */
export const SUPPORTED_BY_API = {
  "soul-2": ["9:16", "16:9", "4:3", "3:4", "1:1", "2:3", "3:2"],
  "marketing-studio": ["auto", "1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "21:9"],
} as const;

export function isGeneratable(model: keyof typeof SUPPORTED_BY_API, format: string): boolean {
  return (SUPPORTED_BY_API[model] as readonly string[]).includes(format);
}

export function deriveFormats(): { generate: AdFormat[]; derive: AdFormat[] } {
  return { generate: ["3:4", "9:16"], derive: ["4:5", "1:1"] };
}

export type CropPlan = {
  width: number;
  height: number;
  /** Desplazamiento vertical del recorte centrado, en píxeles desde arriba. */
  top: number;
  lossPct: number;
};

/**
 * Recorte central del máster al formato destino. El ancho se conserva, se recorta alto.
 * El anclaje es centrado por defecto y editable en la UI cuando algo importante queda
 * fuera — con caras, "centrado" y "bien" no siempre coinciden.
 */
export function cropPlan(from: AdFormat, to: AdFormat): CropPlan {
  const src = FORMAT_SIZE[from];
  const dst = FORMAT_SIZE[to];

  const height = Math.round((src.width * dst.height) / dst.width);
  if (height > src.height) {
    throw new Error(
      `No se puede recortar ${from} a ${to}: haría falta más alto del que tiene el máster.`,
    );
  }

  return {
    width: src.width,
    height,
    top: Math.round((src.height - height) / 2),
    lossPct: ((src.height - height) / src.height) * 100,
  };
}
