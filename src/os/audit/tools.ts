import type { Funcion } from "./types";

/**
 * LAS HERRAMIENTAS.
 *
 * Cada una es un informe sobre un dominio, y cada una tiene su dueño en el equipo.
 *
 * Decisión importante: **la recolección base corre UNA vez, la pidan una herramienta o
 * las tres.** Cargar la página con un navegador tarda veinte segundos y alimenta a las
 * tres a la vez: el píxel es de Paid, el canonical es de SEO y el formulario es de Web,
 * y salen todos de la misma carga. Tres herramientas con su propio rastreo serían tres
 * cargas, tres veces más lento y tres veces más ocasiones de que una falle.
 *
 * Lo que sí es propio de cada herramienta son sus colectores caros: la biblioteca de
 * anuncios solo interesa a Paid, y el rastreo de cien páginas solo a SEO.
 */

export type Herramienta = {
  clave: "paid" | "seo" | "web";
  nombre: string;
  /** Qué áreas del reparto cubre su informe. */
  funciones: Funcion[];
  /** Quién la lleva en el equipo. Aparece en el informe y en CODEOWNERS. */
  dueño: string;
  descripcion: string;
  /** Colectores propios, además de los de base. Cuestan tiempo o credenciales. */
  colectores: string[];
};

export const HERRAMIENTAS: Record<Herramienta["clave"], Herramienta> = {
  paid: {
    clave: "paid",
    nombre: "Auditoría de Paid",
    funciones: [2],
    dueño: "paid",
    descripcion:
      "Qué está anunciando, desde cuándo y con qué medición. Lo que se puede ver de su " +
      "inversión sin tener acceso a su cuenta.",
    colectores: ["adlib"],
  },
  seo: {
    clave: "seo",
    nombre: "Auditoría de SEO",
    funciones: [3],
    dueño: "seo",
    descripcion:
      "Salud técnica, contenido y visibilidad, incluida la de las respuestas generadas " +
      "por IA.",
    colectores: ["crawl"],
  },
  web: {
    clave: "web",
    nombre: "Auditoría Web",
    funciones: [7, 8],
    dueño: "web",
    descripcion:
      "Velocidad real, conversión y circuito del lead: qué pasa desde que alguien entra " +
      "hasta que sus datos llegan a algún sitio.",
    colectores: ["psi"],
  },
};

export const CLAVES = Object.keys(HERRAMIENTAS) as Herramienta["clave"][];

/** Las funciones que cubre una selección de herramientas, sin repetir. */
export function funcionesDe(claves: Herramienta["clave"][]): Funcion[] {
  return [...new Set(claves.flatMap((c) => HERRAMIENTAS[c].funciones))].sort();
}

/** Los colectores propios que hay que ejecutar, sin repetir. */
export function colectoresDe(claves: Herramienta["clave"][]): string[] {
  return [...new Set(claves.flatMap((c) => HERRAMIENTAS[c].colectores))];
}
