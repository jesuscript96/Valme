import type { Confianza, Funcion, Gravedad, Hallazgo, Paso } from "../types";

/**
 * INFRAESTRUCTURA DE REGLAS. Esto no se toca al añadir comprobaciones.
 *
 * Si eres el especialista de un área, tu fichero es `0X-tu-area.ts`. Aquí solo están
 * las piezas que comparten todas las áreas.
 */

/** Acceso tipado a los valores de las señales. */
export type Lectura = {
  num: (id: string) => number;
  bool: (id: string) => boolean;
  txt: (id: string) => string | null;
  lista: (id: string) => string[];
  existe: (id: string) => boolean;
};

export type Regla = {
  /** Identificador único en todo el sistema. Por convención: `area_cosa`. */
  id: string;
  funcion: Funcion;
  /**
   * Señales que la regla necesita. Si alguna falta o no está `verificado`,
   * la regla NO se evalúa. Ausencia de dato no es hallazgo.
   */
  necesita: string[];
  /** Devuelve el hallazgo, o null si no hay nada que decir. */
  evaluar: (v: Lectura) => Omit<Hallazgo, "id" | "funcion" | "evidencia"> | null;
};

/**
 * Atajo para escribir un hallazgo. El orden de los argumentos es el del método:
 * qué pasa, qué provoca, qué se hace.
 */
export const H = (
  titulo: string,
  situacion: string,
  consecuencia: string,
  solucion: string,
  gravedad: Gravedad,
  confianza: Confianza = "alta",
  positivo = false,
) => ({ titulo, situacion, consecuencia, solucion, gravedad, confianza, positivo });

/**
 * Como `H`, pero colgando el hallazgo de un paso del embudo. Lo usa la auditoría Web para
 * que el informe se lea como un recorrido y no como una lista por categorías.
 */
export const HP = (paso: Paso, ...args: Parameters<typeof H>) => ({ ...H(...args), paso });
