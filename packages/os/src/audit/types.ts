/**
 * AUDITORÍA SIN ACCESOS · modelo de datos.
 *
 * Dos niveles, deliberadamente separados:
 *
 *   Señal    — un HECHO observado, con su fuente y su fecha. No opina.
 *   Hallazgo — un JUICIO derivado de señales. Opina, y siempre cita las señales
 *              en las que se apoya.
 *
 * La separación es lo que permite defender cada número en una reunión: la señal se
 * puede reproducir ejecutando la misma comprobación, y el hallazgo se puede discutir
 * sin discutir el dato.
 */

/** Las ocho funciones del equipo de marketing, con su reparto por defecto. */
export const FUNCIONES = {
  1: { nombre: "Dirección y estrategia",      peso: 9 },
  2: { nombre: "Paid media",                  peso: 15 },
  3: { nombre: "SEO, contenido y GEO",        peso: 16 },
  4: { nombre: "Social orgánico",             peso: 15 },
  5: { nombre: "Creatividad, diseño y vídeo", peso: 15 },
  6: { nombre: "Mensaje y copy",              peso: 5 },
  7: { nombre: "Web, landings y CRO",         peso: 13 },
  8: { nombre: "Datos, CRM y leads",          peso: 12 },
} as const;

export type Funcion = keyof typeof FUNCIONES;

/**
 * Estado de una comprobación. Tomado del manual: una comprobación que no se ha podido
 * hacer NO es una comprobación que salga bien. Sin esto, una auditoría con la mitad de
 * las fuentes caídas se presenta como completa.
 */
export type Estado = "verificado" | "parcial" | "pendiente" | "no_aplica";

export type Señal = {
  /** Identificador estable: `area.comprobacion`. Es la clave con la que la citan las reglas. */
  id: string;
  funcion: Funcion;
  /** Qué se ha observado, en una frase. */
  que: string;
  valor: string | number | boolean | string[] | null;
  estado: Estado;
  /** De dónde sale: la herramienta y el objeto exacto. Reproducible. */
  fuente: string;
  url?: string;
  observadoEn: string;
  /** Por qué está pendiente o parcial, si lo está. */
  limite?: string;
};

/**
 * EL EMBUDO.
 *
 * Una auditoría web comercial no se ordena por categorías técnicas sino por dónde se
 * pierde la gente entre el clic y el lead. Cada hallazgo cuelga del paso donde hace daño,
 * y así el informe se lee solo: «llegan, entienden, confían, y en el paso cuatro tenéis un
 * formulario de nueve campos».
 */
export const PASOS = {
  llega:    { n: 1, titulo: "¿Llega?",          desc: "Carga, errores y móvil real" },
  entiende: { n: 2, titulo: "¿Entiende?",       desc: "Qué ve en la primera pantalla" },
  confia:   { n: 3, titulo: "¿Confía?",         desc: "Pruebas, legal y quién hay detrás" },
  puede:    { n: 4, titulo: "¿Puede?",          desc: "Fricción, formulario y accesibilidad" },
  registro: { n: 5, titulo: "¿Queda registro?", desc: "Medición y circuito del lead" },
} as const;

export type Paso = keyof typeof PASOS;

export type Gravedad = "p0" | "p1" | "p2" | "p3";
export type Confianza = "alta" | "media" | "baja";

export type Hallazgo = {
  id: string;
  funcion: Funcion;
  titulo: string;
  /** Qué pasa. Descriptivo, sin juicio. */
  situacion: string;
  /** Qué provoca. Aquí va el impacto. */
  consecuencia: string;
  /** La acción concreta. Sin esto no es un hallazgo, es una queja. */
  solucion: string;
  gravedad: Gravedad;
  confianza: Confianza;
  /** IDs de las señales que lo sostienen. Un hallazgo sin señales no se emite. */
  evidencia: string[];
  /** Verdadero cuando es algo que funciona bien. Se reconoce antes de proponer nada. */
  positivo?: boolean;
  /** Paso del embudo donde ocurre. Lo usa la auditoría Web para ordenar el informe. */
  paso?: Paso;
};

export type Cobertura = {
  funcion: Funcion;
  verificadas: number;
  pendientes: number;
  noAplica: number;
  /** Porcentaje de comprobaciones de esa función que se han podido hacer. */
  pct: number;
};

export type Auditoria = {
  dominio: string;
  urlFinal: string;
  iniciadaEn: string;
  duracionMs: number;
  señales: Señal[];
  hallazgos: Hallazgo[];
  cobertura: Cobertura[];
  /** Fuentes que no se han podido usar y por qué. Va en la portada del informe. */
  fuentesNoDisponibles: { fuente: string; motivo: string }[];
};

export const ahora = () => new Date().toISOString();

export function señal(s: Omit<Señal, "observadoEn">): Señal {
  return { ...s, observadoEn: ahora() };
}
