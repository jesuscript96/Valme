// Catálogo de demostración de VALME Search OS.
// Todos los datos son ficticios y se declaran como tales en cada respuesta.

export const DEMO_NOTICE =
  "DATOS FICTICIOS · entorno de demostración de VALME Search OS. Ninguna cifra es una medición real.";

export const PRINCIPIO =
  "Los agentes ejecutan. El Project Manager dirige. Aprobar nunca equivale a ejecutar.";

export const SERVICIOS = [
  { id: "SEO", nombre: "SEO", descripcion: "Posicionamiento en buscadores: indexación, rastreo, arquitectura y contenidos." },
  { id: "SEO técnico", nombre: "SEO técnico", descripcion: "Rendimiento, redirecciones, marcado estructurado y rastreo." },
  { id: "AEO", nombre: "AEO", descripcion: "Respuestas en asistentes: afirmaciones citables y fuentes verificables." },
  { id: "GEO", nombre: "GEO", descripcion: "Presencia en resultados generativos: intención, claridad y atribución." },
  { id: "Contenidos", nombre: "Contenidos", descripcion: "Producción y revisión editorial dentro del alcance autorizado." },
] as const;

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

export const PASOS_ONBOARDING = [
  { letra: "A", titulo: "Empresa y responsables", visibleParaCliente: true },
  { letra: "B", titulo: "Servicio y alcance", visibleParaCliente: false },
  { letra: "C", titulo: "Negocio y prioridades", visibleParaCliente: true },
  { letra: "D", titulo: "Contexto y materiales", visibleParaCliente: true },
  { letra: "E", titulo: "Accesos y permisos", visibleParaCliente: true },
  { letra: "F", titulo: "Autonomía y límites", visibleParaCliente: false },
  { letra: "G", titulo: "Equipo de agentes", visibleParaCliente: false },
  { letra: "H", titulo: "Revisión y activación", visibleParaCliente: false },
] as const;

export const ESTADOS_DIAGNOSTICO = [
  { estado: "Pendiente", significado: "El alta está aprobada y el encargo de diagnóstico existe, pero nadie lo ha iniciado." },
  { estado: "En curso", significado: "Los agentes recogen hallazgos con evidencia dentro del alcance disponible." },
  { estado: "Bloqueado", significado: "No queda trabajo ejecutable: todo depende de accesos sin validar." },
  { estado: "En revisión", significado: "Enviado a control de calidad; puede ser devuelto con motivo." },
  { estado: "Completado", significado: "Validado por calidad; solo entonces se puede generar el plan de trabajo." },
] as const;

export const ESTADOS_ACCESO = [
  "No solicitado",
  "Pendiente",
  "Validado",
  "Insuficiente",
  "Caducado",
] as const;

export const PASOS_CALIDAD = [
  "Alcance cubierto por los hallazgos, uno por servicio contratado",
  "Cada hallazgo tiene evidencia, fuente y fecha",
  "Datos ausentes y limitaciones declarados expresamente",
] as const;

export const HALLAZGOS_TIPO = [
  { id: "h1", titulo: "Categorías principales sin indexar", servicio: "SEO", dependeDe: "Search Console", prioridad: "Alta" },
  { id: "h2", titulo: "Cadenas de redirección en rutas antiguas", servicio: "SEO técnico", dependeDe: "Registros de servidor", prioridad: "Media" },
  { id: "h3", titulo: "Fichas con contenido duplicado", servicio: "Contenidos", dependeDe: "CMS", prioridad: "Media" },
  { id: "h4", titulo: "Conversiones orgánicas sin medición válida", servicio: "SEO", dependeDe: "Analítica", prioridad: "Alta" },
  { id: "h5", titulo: "Afirmaciones sin fuente citable", servicio: "AEO", dependeDe: null, prioridad: "Alta" },
  { id: "h6", titulo: "Intención poco clara en títulos y encabezados", servicio: "GEO", dependeDe: null, prioridad: "Baja" },
] as const;

export const REGLAS_FLUJO = [
  "Sin información validada no empieza el trabajo: el Project Manager autoriza cada activación.",
  "Al aprobar un alta, el cliente queda en «Diagnóstico pendiente» y se crea un único encargo de diagnóstico.",
  "Un acceso sin validar bloquea solo los hallazgos que dependen de él; el resto del alcance continúa.",
  "Si un acceso deja de estar validado, el trabajo dependiente vuelve a quedar bloqueado y caduca la declaración anterior.",
  "Control de calidad devuelve el diagnóstico cuando falta declarar lo que no se puede medir; la devolución queda registrada.",
  "Una declaración de cobertura solo vale para los servicios declarados; otro servicio sin cobertura exige declararlo de nuevo.",
  "El plan de trabajo se genera solo desde un diagnóstico validado y siempre por versiones.",
  "Aprobar un plan lo deja «Listo para ejecución»: no ejecuta, no publica y no comunica nada.",
  "Pedir cambios o rechazar un plan exige un motivo escrito; modificar un plan aprobado crea una versión nueva pendiente.",
  "Las acciones sensibles (publicar, comunicar, presupuesto, permisos, eliminar) requieren autorización humana.",
] as const;
