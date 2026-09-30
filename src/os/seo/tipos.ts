/**
 * SEO · GEO · AEO — modelo de datos.
 *
 * Portado de VALME Search OS. Una auditoría es un ENCARGO con alcance, límites y
 * autorización; lo que se observa son evidencias, lo que se concluye son hallazgos, y
 * lo que se hace con cada hallazgo lo decide un PM (admin o estratega) y se sigue con
 * tareas que tienen responsable, fecha y criterio de hecho.
 */

export const ESTADOS = [
  "borrador",
  "pendiente_autorizacion",
  "autorizado",
  "en_cola",
  "en_ejecucion",
  "bloqueado",
  "control_calidad",
  "devuelto",
  "validado",
  "cancelado",
] as const;
export type EstadoAuditoria = (typeof ESTADOS)[number];

export const ESTADO_LABEL: Record<EstadoAuditoria, string> = {
  borrador: "Borrador",
  pendiente_autorizacion: "Pendiente de autorización",
  autorizado: "Autorizado",
  en_cola: "En cola",
  en_ejecucion: "En ejecución",
  bloqueado: "Bloqueado",
  control_calidad: "Control de calidad",
  devuelto: "Devuelto",
  validado: "Validado",
  cancelado: "Cancelado",
};

export const SERVICIOS = ["SEO técnico", "Contenidos", "AEO/GEO", "Analítica"] as const;
export type Servicio = (typeof SERVICIOS)[number];

export const PRIORIDADES = ["critica", "alta", "media", "baja"] as const;
export type Prioridad = (typeof PRIORIDADES)[number];
export const PRIORIDAD_LABEL: Record<Prioridad, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export type Confianza = "alta" | "media" | "baja";
export const CONFIANZA_LABEL: Record<Confianza, string> = {
  alta: "Confianza alta",
  media: "Confianza media",
  baja: "Confianza baja",
};

export const DECISIONES = ["pendiente", "priorizar", "investigar", "descartar"] as const;
export type Decision = (typeof DECISIONES)[number];
export const DECISION_LABEL: Record<Decision, string> = {
  pendiente: "Pendiente",
  priorizar: "Priorizar",
  investigar: "Investigar",
  descartar: "Descartar",
};

export const CATEGORIA_LABEL: Record<string, string> = {
  seo_tecnico: "SEO técnico",
  indexacion: "Indexación",
  contenido: "Contenido",
  eeat: "E-E-A-T",
  schema_org: "Schema.org",
  rendimiento: "Rendimiento",
  aeo_geo_citabilidad: "AEO/GEO y citabilidad",
  search_console: "Search Console",
  analitica: "Analítica",
};

export const TIPOS_TAREA = ["investigacion", "accion"] as const;
export type TipoTarea = (typeof TIPOS_TAREA)[number];
export const TIPO_TAREA_LABEL: Record<TipoTarea, string> = {
  investigacion: "Investigación",
  accion: "Acción del plan",
};

export const ESTADOS_TAREA = ["pendiente", "en_curso", "hecha", "cancelada"] as const;
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];
export const ESTADO_TAREA_LABEL: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  hecha: "Hecha",
  cancelada: "Cancelada",
};

export type EstadoCobertura =
  | "evidencia_suficiente"
  | "cobertura_parcial"
  | "ausencia_declarada"
  | "pendiente_justificado";
export const COBERTURA_LABEL: Record<EstadoCobertura, string> = {
  evidencia_suficiente: "Evidencia suficiente",
  cobertura_parcial: "Cobertura parcial",
  ausencia_declarada: "Ausencia declarada",
  pendiente_justificado: "Pendiente",
};

/** Los ocho agentes especialistas de Search OS. Se asignan a tareas; no ejecutan solos. */
export const AGENTES = [
  { id: "ag_onboarding", nombre: "Agente Onboarding", especialidad: "Onboarding y accesos" },
  { id: "ag_auditoria", nombre: "Agente Auditoría", especialidad: "Auditoría SEO" },
  { id: "ag_estrategia", nombre: "Agente Estrategia", especialidad: "Estrategia y planificación" },
  { id: "ag_tecnico", nombre: "Agente Técnico", especialidad: "SEO técnico" },
  { id: "ag_contenido", nombre: "Agente Contenido", especialidad: "Contenidos" },
  { id: "ag_geo", nombre: "Agente GEO", especialidad: "AEO/GEO y citabilidad" },
  { id: "ag_analitica", nombre: "Agente Analítica", especialidad: "Analítica e informes" },
  { id: "ag_calidad", nombre: "Agente Calidad", especialidad: "Control de calidad" },
] as const;

export type Proyecto = {
  id: string;
  clientId: string;
  nombre: string;
  dominio: string;
  creadoEn: string;
};

export type Autorizacion = { por: string; en: string; referencia: string };

export type Auditoria = {
  id: string;
  /** Referencia visible: AUD-2026-001. */
  ref: string;
  clientId: string;
  proyectoId: string;
  dominio: string;
  estado: EstadoAuditoria;
  servicios: Servicio[];
  alcance: string;
  limites: { paginas: number; minutos: number; costeEur: number };
  solicitadaPor: string;
  creadaEn: string;
  actualizadaEn: string;
  autorizacion: Autorizacion | null;
  /** Motivo del último bloqueo, devolución o cancelación. */
  motivo: string | null;
  archivadaEn: string | null;
  archivadaPor: string | null;
};

export type Evidencia = {
  id: string;
  auditoriaId: string;
  recurso: string;
  fuente: string;
  metodo: string;
  observado: string;
  observadoEn: string;
  /** Lo que viene de fuera (una web, una API) no es de fiar por defecto. */
  externa: boolean;
};

export type DecisionHallazgo = {
  valor: Decision;
  nota: string;
  por: string | null;
  en: string | null;
};

export type Hallazgo = {
  id: string;
  auditoriaId: string;
  categoria: string;
  servicio: Servicio;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  impacto: string;
  recomendacion: string;
  confianza: Confianza;
  fuentes: string[];
  evidencias: string[];
  limitaciones: string[];
  responsable: string;
  creadoEn: string;
  decision: DecisionHallazgo;
};

export type Tarea = {
  id: string;
  auditoriaId: string;
  hallazgoId: string;
  tipo: TipoTarea;
  titulo: string;
  detalle: string;
  criterio: string;
  responsableId: string;
  agenteId: string | null;
  fecha: string | null;
  estado: EstadoTarea;
  conclusion: string;
  resultado: "priorizar" | "descartar" | null;
  creadaPor: string;
  creadaEn: string;
  cerradaPor: string | null;
  cerradaEn: string | null;
};

export type Evento = {
  id: string;
  auditoriaId: string;
  en: string;
  por: string;
  texto: string;
};

export type Declaracion = {
  auditoriaId: string;
  servicio: Servicio;
  estado: "ausencia_declarada" | "pendiente_justificado";
  motivo: string;
  por: string;
  en: string;
};

export type Datos = {
  proyectos: Proyecto[];
  auditorias: Auditoria[];
  evidencias: Evidencia[];
  hallazgos: Hallazgo[];
  tareas: Tarea[];
  eventos: Evento[];
  declaraciones: Declaracion[];
};

/** Quien actúa. `pm` = puede decidir: admin o estratega. */
export type Actor = { id: string; nombre: string; pm: boolean };

export type Resultado = { ok: true } | { ok: false; error: string };
