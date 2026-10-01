import { FUNCIONES, type Funcion, type Hallazgo, type Señal } from "../types";
import type { Lectura, Regla } from "./tipos";

import { REGLAS as estrategia } from "./01-estrategia";
import { REGLAS as paid } from "./02-paid";
import { REGLAS as seo } from "./03-seo";
import { REGLAS as social } from "./04-social";
import { REGLAS as creatividad } from "./05-creatividad";
import { REGLAS as copy } from "./06-copy";
import { REGLAS as web } from "./07-web";
import { REGLAS as datos } from "./08-datos";

export type { Lectura, Regla } from "./tipos";
export { H } from "./tipos";

/**
 * MOTOR DE REGLAS. De señales a hallazgos, sin IA y sin ambigüedad.
 *
 * Un fichero por área y cada área tiene un dueño. Añadir una comprobación es añadir
 * una entrada a tu array: nadie toca el fichero de otro y los PR no chocan.
 *
 * Tres propiedades que no se negocian:
 *
 *  · Si una señal que la regla necesita no está `verificado`, la regla NO se dispara.
 *    Ausencia de dato no es hallazgo.
 *  · Todo hallazgo cita las señales que lo sostienen.
 *  · Los positivos son reglas como las demás. Se reconoce lo que funciona antes de
 *    proponer nada.
 *
 * La IA no entra aquí. Entra después y solo para redactar: nunca para decidir si algo
 * es un hallazgo.
 */
export const REGLAS: Regla[] = [
  ...estrategia, ...paid, ...seo, ...social,
  ...creatividad, ...copy, ...web, ...datos,
];

export function aplicar(señales: Señal[]): Hallazgo[] {
  const por = new Map(señales.map((s) => [s.id, s]));

  const leer: Lectura = {
    num: (id) => Number(por.get(id)?.valor ?? 0),
    bool: (id) => Boolean(por.get(id)?.valor),
    txt: (id) => { const v = por.get(id)?.valor; return typeof v === "string" ? v : null; },
    lista: (id) => { const v = por.get(id)?.valor; return Array.isArray(v) ? v.map(String) : []; },
    existe: (id) => por.has(id),
  };

  const out: Hallazgo[] = [];
  for (const regla of REGLAS) {
    const usadas = regla.necesita.map((id) => por.get(id));
    if (usadas.some((s) => !s || s.estado !== "verificado")) continue;

    const r = regla.evaluar(leer);
    if (r) out.push({ ...r, id: regla.id, funcion: regla.funcion, evidencia: regla.necesita });
  }

  // Los positivos primero: el método pide reconocer lo que funciona antes de proponer
  // nada. Dentro de cada grupo, por gravedad.
  const orden: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
  return out.sort((a, b) =>
    Number(b.positivo) - Number(a.positivo) || orden[a.gravedad] - orden[b.gravedad]);
}

/** Cobertura por función: qué parte de lo comprobable se ha podido comprobar. */
export function cobertura(señales: Señal[]) {
  return (Object.keys(FUNCIONES) as unknown as Funcion[]).map((f) => {
    const s = señales.filter((x) => x.funcion === Number(f));
    const verificadas = s.filter((x) => x.estado === "verificado").length;
    const pendientes = s.filter((x) => x.estado === "pendiente").length;
    const noAplica = s.filter((x) => x.estado === "no_aplica").length;
    const base = s.length - noAplica;
    return {
      funcion: Number(f) as Funcion, verificadas, pendientes, noAplica,
      pct: base > 0 ? Math.round((verificadas / base) * 100) : 0,
    };
  });
}
