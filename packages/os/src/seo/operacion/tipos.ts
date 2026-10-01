/**
 * OPERACIÓN DEL SERVICIO SEO · modelo de datos.
 *
 * Portado de VALME Search OS: alta del cliente (onboarding en ocho pasos), encargo de
 * diagnóstico con control de calidad, plan de trabajo versionado con decisión del PM,
 * informes con dos llaves (aprobar contenido y autorizar envío) y registro de actividad.
 * Lo que en Search OS eran cifras fijas de demostración aquí se calcula con datos reales.
 */

export const ESPECIALIDADES = [
  "Onboarding y accesos",
  "Auditoría SEO",
  "Estrategia y planificación",
  "SEO técnico",
  "Contenidos",
  "AEO/GEO y citabilidad",
  "Analítica e informes",
  "Control de calidad",
] as const;
export type Especialidad = (typeof ESPECIALIDADES)[number];

export const SERVICIOS_ALTA = ["SEO", "SEO local", "Contenidos", "SEO técnico", "AEO", "GEO"] as const;
export type ServicioAlta = (typeof SERVICIOS_ALTA)[number];

export const HERRAMIENTAS_ACCESO = [
  { id: "gsc", nombre: "Search Console", finalidad: "Leer rendimiento e indexación", permiso: "Lectura restringida" },
  { id: "ga4", nombre: "Analytics 4", finalidad: "Medir tráfico y conversiones", permiso: "Visualizador" },
  { id: "cms", nombre: "CMS del sitio", finalidad: "Preparar borradores (sin publicar)", permiso: "Editor sin publicación" },
  { id: "logs", nombre: "Servidor o logs", finalidad: "Comprobar rastreo y errores", permiso: "Solo consulta" },
  { id: "gbp", nombre: "Perfil de empresa", finalidad: "Presencia local", permiso: "Gestor sin publicación" },
] as const;
export type AccesoId = (typeof HERRAMIENTAS_ACCESO)[number]["id"];

export const ESTADOS_ACCESO = ["No solicitado", "Pendiente", "Validado", "Insuficiente", "Caducado"] as const;
export type EstadoAcceso = (typeof ESTADOS_ACCESO)[number];

export const NIVELES_AUTONOMIA = [
  "El agente prepara y ejecuta",
  "Autorización del PM",
  "Aprobación del cliente",
] as const;
export type NivelAutonomia = (typeof NIVELES_AUTONOMIA)[number];

export const ACCIONES_AUTONOMIA = [
  { id: "analisis", label: "Analizar datos y preparar diagnósticos", sensible: false },
  { id: "borradores", label: "Redactar borradores y propuestas", sensible: false },
  { id: "publicar", label: "Publicar contenido o cambios en el sitio", sensible: true },
  { id: "comunicar", label: "Enviar comunicaciones al cliente", sensible: true },
  { id: "presupuesto", label: "Cambiar presupuesto o alcance", sensible: true },
  { id: "permisos", label: "Modificar permisos o accesos", sensible: true },
  { id: "eliminar", label: "Eliminar información", sensible: true },
] as const;
export type AccionAutonomiaId = (typeof ACCIONES_AUTONOMIA)[number]["id"];

export const SITUACION_INICIAL = ["Pendiente de medir", "Conocida y documentada", "Parcial"] as const;

/** Campos del asistente. `req` = obligatorio; `paso` = letra del paso. */
export const CAMPOS = [
  { id: "nombre", paso: "A", label: "Nombre comercial", req: true },
  { id: "dominio", paso: "A", label: "Dominio principal", req: true },
  { id: "sector", paso: "A", label: "Sector", req: true },
  { id: "mercados", paso: "A", label: "Países, idiomas y ubicaciones", req: true },
  { id: "contacto", paso: "A", label: "Contacto principal", req: true },
  { id: "aprobador", paso: "A", label: "Aprobador por parte del cliente", req: true },
  { id: "pm", paso: "A", label: "Project Manager asignado", req: true },
  { id: "entregables", paso: "B", label: "Entregables y frecuencia", req: true },
  { id: "exclusiones", paso: "B", label: "Exclusiones del alcance", req: true },
  { id: "inicio", paso: "B", label: "Fecha de inicio", req: true },
  { id: "revision", paso: "B", label: "Fecha de revisión del servicio", req: true },
  { id: "limites", paso: "B", label: "Límites de consumo y dedicación previstos", req: true },
  { id: "prioritarios", paso: "C", label: "Productos o servicios prioritarios", req: true },
  { id: "publico", paso: "C", label: "Público y mercados", req: true },
  { id: "competidores", paso: "C", label: "Competidores de referencia", req: true },
  { id: "objetivos", paso: "C", label: "Objetivos de negocio", req: true },
  { id: "indicadores", paso: "C", label: "Indicadores acordados", req: true },
  { id: "base", paso: "C", label: "Situación inicial", req: true },
  { id: "marca", paso: "D", label: "Marca y tono de comunicación", req: true },
  { id: "materiales", paso: "D", label: "Documentación y contenidos existentes", req: false },
  { id: "restricciones", paso: "D", label: "Restricciones editoriales y temas sensibles", req: true },
  { id: "previos", paso: "D", label: "Trabajos previos relevantes", req: false },
  { id: "fuentes", paso: "D", label: "Referencias y fuentes autorizadas", req: true },
  { id: "incidencias", paso: "F", label: "Quién recibe las incidencias y en qué plazo responde", req: false },
] as const;
export type CampoId = (typeof CAMPOS)[number]["id"];

export const PASOS_ALTA = [
  { letra: "A", titulo: "Empresa y responsables", cliente: true },
  { letra: "B", titulo: "Servicio y alcance", cliente: false },
  { letra: "C", titulo: "Negocio y objetivos", cliente: true },
  { letra: "D", titulo: "Contexto y materiales", cliente: true },
  { letra: "E", titulo: "Accesos e integraciones", cliente: true },
  { letra: "F", titulo: "Autonomía y aprobaciones", cliente: false },
  { letra: "G", titulo: "Equipo y capacidad", cliente: false },
  { letra: "H", titulo: "Revisión y activación", cliente: false },
] as const;
export type LetraPaso = (typeof PASOS_ALTA)[number]["letra"];

export type Excepcion = { req: "accesos" | "linea-base"; motivo: string; por: string; en: string };

export type Alta = {
  /** ONB-001… */
  id: string;
  estado: "Borrador" | "Activo";
  creadaEn: string;
  creadaPor: string;
  /** Cliente de Valme al que corresponde. Si es una empresa nueva, se crea al activar. */
  clientId: string | null;
  datos: Partial<Record<CampoId, string>>;
  servicios: ServicioAlta[];
  accesos: Record<AccesoId, EstadoAcceso>;
  autonomia: Record<AccionAutonomiaId, NivelAutonomia>;
  equipo: Especialidad[];
  responsableCalidad: string;
  excepciones: Excepcion[];
  historial: string[];
  activadaEn: string | null;
};

// --- Diagnóstico -----------------------------------------------------------

export const ESTADOS_ENCARGO = ["Pendiente", "En curso", "Bloqueado", "En revisión", "Completado"] as const;
export type EstadoEncargo = (typeof ESTADOS_ENCARGO)[number];

export type HallazgoDiagnostico = {
  ref: string;
  titulo: string;
  /** Acceso del que depende; sin él no se puede medir. */
  dep: AccesoId | null;
  servicio: ServicioAlta;
  prioridad: "Alta" | "Media" | "Baja";
  queComprobar: string;
  /** Lo registra el equipo al comprobarlo. Sin fuente, fecha y referencia no se envía a calidad. */
  fuente: string;
  fecha: string;
  evidencia: string;
  impacto: string;
  limitaciones: string;
};

export type Comprobacion = { texto: string; ok: boolean; detalle: string };

export type RevisionCalidad = {
  n: number;
  resultado: "Validado" | "Devuelto para corrección";
  comprobaciones: Comprobacion[];
  comentario: string;
  por: string;
  en: string;
};

export const ESTADOS_PLAN = ["Pendiente de aprobación", "Listo para ejecución", "Cambios solicitados", "Rechazado"] as const;
export type EstadoPlan = (typeof ESTADOS_PLAN)[number];

export type AccionPlan = {
  n: number;
  accion: string;
  justifica: string;
  entregable: string;
  criterio: string;
  agente: Especialidad;
  dependencias: string;
  plazo: string;
  esfuerzo: string;
  aprobacion: string;
};

export type DecisionPlan = {
  tipo: "Aprobado" | "Cambios solicitados" | "Rechazado";
  comentario: string;
  por: string;
  en: string;
  version: number;
};

export type PlanTrabajo = {
  version: number;
  estado: EstadoPlan;
  creadoEn: string;
  motivo: string;
  acciones: AccionPlan[];
  excluidas: string[];
  decisiones: DecisionPlan[];
};

export type Encargo = {
  /** DIA-001… */
  id: string;
  altaId: string;
  clientId: string;
  creadoEn: string;
  estado: EstadoEncargo;
  servicios: ServicioAlta[];
  objetivos: string;
  agentes: Especialidad[];
  hallazgos: HallazgoDiagnostico[];
  limitacionesDeclaradas: boolean;
  coberturaDeclarada: boolean;
  serviciosSinCobertura: ServicioAlta[];
  revisiones: RevisionCalidad[];
  planes: PlanTrabajo[];
  historial: string[];
};

// --- Informes --------------------------------------------------------------

export const TIPOS_INFORME = {
  auditoria: "Resultado de auditoría SEO",
  diagnostico: "Diagnóstico y plan de trabajo",
  geo: "Visibilidad en asistentes de IA",
} as const;
export type TipoInforme = keyof typeof TIPOS_INFORME;

export type Informe = {
  /** REP-001… */
  id: string;
  clientId: string;
  tipo: TipoInforme;
  /** Auditoría, encargo o proyecto del que sale. */
  origenId: string;
  titulo: string;
  creadoEn: string;
  creadoPor: string;
  fechaEntrega: string | null;
  contenidoAprobado: { por: string; en: string } | null;
  envioAutorizado: { por: string; en: string } | null;
};

// --- Actividad -------------------------------------------------------------

export type EstadoActividad =
  | "Acción completada" | "Aprobación pendiente" | "Bloqueo" | "Riesgo" | "Error"
  | "Datos insuficientes" | "Revisión humana en curso" | "Funcionamiento normal";

export type Actividad = {
  id: string;
  en: string;
  por: string;
  clientId: string | null;
  especialidad: Especialidad | null;
  estado: EstadoActividad;
  texto: string;
  enlace: string | null;
};
