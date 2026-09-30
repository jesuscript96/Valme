import type { Actor, Datos } from "../tipos";
import { ErrorSeo, exigirPM, limpio, registrar, sello, siguienteRef } from "./comun";
import {
  HERRAMIENTAS_ACCESO,
  type AccesoId, type AccionPlan, type Alta, type Comprobacion, type Encargo, type Especialidad,
  type EstadoAcceso, type HallazgoDiagnostico, type PlanTrabajo, type ServicioAlta,
} from "./tipos";

/**
 * ENCARGO DE DIAGNÓSTICO.
 *
 * Uno por cliente, creado al activar el onboarding. Recorre Pendiente → En curso →
 * En revisión → Completado (o vuelve a En curso si calidad lo devuelve). Lo que depende
 * de un acceso sin validar queda bloqueado y se declara como limitación: lo que no se
 * puede medir se dice, no se estima. Con el diagnóstico validado se genera el plan.
 */

/**
 * Qué se comprueba en cada servicio. En Search OS llevaba cifras de ejemplo; aquí solo
 * dice qué hay que mirar: el resultado lo registra el equipo con su fuente.
 */
export const CATALOGO: Omit<HallazgoDiagnostico, "ref" | "fuente" | "fecha" | "evidencia" | "impacto" | "limitaciones">[] = [
  { titulo: "Categorías principales sin indexar", dep: "gsc", servicio: "SEO", prioridad: "Alta", queComprobar: "Informe de cobertura de Search Console: páginas de categoría excluidas y motivo." },
  { titulo: "Cadenas de redirección en rutas antiguas", dep: "logs", servicio: "SEO técnico", prioridad: "Media", queComprobar: "Registros del servidor: redirecciones encadenadas y URL que pierden rastreo." },
  { titulo: "Fichas con contenido duplicado", dep: "cms", servicio: "Contenidos", prioridad: "Media", queComprobar: "Inventario del CMS: fichas que compiten entre sí por la misma búsqueda." },
  { titulo: "Conversiones orgánicas sin medición válida", dep: "ga4", servicio: "SEO", prioridad: "Alta", queComprobar: "Configuración de Analytics: conversiones definidas y atribución al canal orgánico." },
  { titulo: "Afirmaciones sin fuente citable", dep: null, servicio: "AEO", prioridad: "Alta", queComprobar: "Revisión editorial: afirmaciones que un asistente no podría citar por falta de fuente." },
  { titulo: "Intención poco clara en títulos y encabezados", dep: null, servicio: "GEO", prioridad: "Baja", queComprobar: "Revisión de plantillas: títulos y encabezados que no dicen qué resuelve la página." },
];

const nombreAcceso = (id: AccesoId) => HERRAMIENTAS_ACCESO.find((h) => h.id === id)?.nombre ?? id;

export const rutaEncargo = (clientId: string) => `/app/seo/clientes/${clientId}?tab=diagnostico`;

export function crearEncargo(d: Datos, a: Alta): Encargo {
  if (!a.clientId) throw new ErrorSeo("El alta no tiene cliente.");
  const existente = d.encargos.find((e) => e.clientId === a.clientId);
  if (existente) return existente;
  const servicios = a.servicios.length ? a.servicios : (["SEO"] as ServicioAlta[]);
  const e: Encargo = {
    id: siguienteRef("DIA", d.encargos.map((x) => x.id)),
    altaId: a.id,
    clientId: a.clientId,
    creadoEn: new Date().toISOString(),
    estado: "Pendiente",
    servicios: a.servicios,
    objetivos: limpio(a.datos.objetivos),
    agentes: a.equipo,
    hallazgos: CATALOGO.filter((c) => servicios.includes(c.servicio) || c.dep === "gsc").map((c, i) => ({
      ...c, ref: `H-${String(i + 1).padStart(2, "0")}`, fuente: "", fecha: "", evidencia: "", impacto: "", limitaciones: "",
    })),
    limitacionesDeclaradas: false,
    coberturaDeclarada: false,
    serviciosSinCobertura: [],
    revisiones: [],
    planes: [],
    historial: [`${sello()} · Encargo de diagnóstico creado tras la activación del onboarding.`],
  };
  d.encargos.push(e);
  return e;
}

// --- Estado derivado -------------------------------------------------------

export type Bloqueo = { acceso: AccesoId; nombre: string; estado: EstadoAcceso; afectados: string[] };

export function bloqueos(e: Encargo, a: Alta): Bloqueo[] {
  const deps = [...new Set(e.hallazgos.map((h) => h.dep).filter((x): x is AccesoId => Boolean(x)))];
  return deps
    .filter((dep) => a.accesos[dep] !== "Validado")
    .map((dep) => ({
      acceso: dep, nombre: nombreAcceso(dep), estado: a.accesos[dep],
      afectados: e.hallazgos.filter((h) => h.dep === dep).map((h) => h.titulo),
    }));
}

export const disponibles = (e: Encargo, a: Alta) =>
  e.hallazgos.filter((h) => !h.dep || a.accesos[h.dep] === "Validado");

export const completo = (h: HallazgoDiagnostico) => Boolean(h.fuente && h.fecha && h.evidencia);

export function sinCobertura(e: Encargo, a: Alta): ServicioAlta[] {
  const disp = disponibles(e, a).filter(completo);
  return e.servicios.filter((s) => !disp.some((h) => h.servicio === s));
}

export function coberturaOk(e: Encargo, a: Alta): boolean {
  const faltan = sinCobertura(e, a);
  return !faltan.length || (e.coberturaDeclarada && faltan.every((s) => e.serviciosSinCobertura.includes(s)));
}

export const enCurso = (e: Encargo, a: Alta) =>
  e.estado === "En curso" || (e.estado === "Bloqueado" && disponibles(e, a).length > 0);

export const ultimoPlan = (e: Encargo) => e.planes[e.planes.length - 1] ?? null;

/** Estado del cliente en el servicio SEO, a partir de su alta y su encargo. */
export function estadoCliente(a: Alta | null, e: Encargo | null): string {
  if (!a) return "Sin alta SEO";
  if (a.estado === "Borrador") return "Onboarding";
  if (!e) return "Diagnóstico pendiente";
  const p = ultimoPlan(e);
  if (p?.estado === "Listo para ejecución") return "Plan aprobado";
  if (p) return "Plan pendiente";
  return {
    Completado: "Diagnóstico completado",
    "En revisión": "Diagnóstico en revisión",
    Bloqueado: "Diagnóstico bloqueado",
    "En curso": "Diagnóstico en curso",
    Pendiente: "Diagnóstico pendiente",
  }[e.estado];
}

// --- Impedimentos: por qué no se puede dar cada paso ------------------------

export type Impedimento = { texto: string; resolucion: string };
export type Paso = "iniciar" | "declarar" | "enviar" | "calidad" | "plan";

export const TITULO_IMPEDIMENTO: Record<Paso, string> = {
  iniciar: "No se puede iniciar el diagnóstico.",
  declarar: "No hay nada que declarar.",
  enviar: "El diagnóstico está incompleto: no se envía a control de calidad.",
  calidad: "No se puede ejecutar la revisión de calidad.",
  plan: "No se puede generar el plan de trabajo.",
};

export function impedimentos(paso: Paso, e: Encargo, a: Alta): Impedimento[] {
  const out: Impedimento[] = [];
  const bl = bloqueos(e, a);
  const faltan = sinCobertura(e, a);
  const disp = disponibles(e, a);
  if (paso === "iniciar") {
    if (e.estado !== "Pendiente") out.push({ texto: `El encargo ya está ${e.estado.toLowerCase()}.`, resolucion: "No hace falta iniciarlo otra vez." });
    if (!e.servicios.length) out.push({ texto: "El encargo no tiene servicio contratado.", resolucion: "Indicar el servicio en el paso B del onboarding." });
    if (!e.objetivos) out.push({ texto: "Sin objetivos de negocio registrados: el diagnóstico no tendría criterio de prioridad.", resolucion: "Completar los objetivos en el paso C del onboarding." });
    if (!e.agentes.length) out.push({ texto: "Sin agentes asignados al encargo.", resolucion: "Asignar equipo en el paso G del onboarding." });
  }
  if (paso === "declarar") {
    if (!bl.length && !faltan.length) {
      out.push({ texto: "No hay datos ausentes ni servicios sin cobertura que declarar.", resolucion: "Todos los accesos necesarios están validados y cada servicio contratado tiene hallazgos con evidencia." });
    } else if ((!bl.length || e.limitacionesDeclaradas) && coberturaOk(e, a)) {
      out.push({ texto: "Lo pendiente ya está declarado.", resolucion: "No es necesario repetirlo." });
    }
  }
  if (paso === "enviar") {
    if (!enCurso(e, a)) out.push({ texto: `El encargo no tiene trabajo en curso (estado actual: ${e.estado}).`, resolucion: "Iniciar el diagnóstico, o conseguir al menos un acceso validado para que quede trabajo ejecutable." });
    if (!disp.length) out.push({ texto: "No hay ningún hallazgo sin bloqueo: la respuesta sería vacía.", resolucion: "Conseguir al menos un acceso validado para poder revisar algo con evidencia." });
    const incompletos = disp.filter((h) => !completo(h)).length;
    if (incompletos) out.push({ texto: `${incompletos} hallazgo(s) sin fuente, fecha o referencia de evidencia.`, resolucion: "Completar la evidencia de cada hallazgo; sin fuente no se envía." });
    if (bl.length && !e.limitacionesDeclaradas) out.push({ texto: "Hay accesos sin validar y las limitaciones no están declaradas.", resolucion: "Pulsar «Declarar datos ausentes y limitaciones»: lo que no se puede medir se dice, no se estima." });
    if (!coberturaOk(e, a)) {
      out.push({
        texto: `Servicios contratados sin ningún hallazgo con evidencia: ${faltan.join(", ")}.` +
          (e.coberturaDeclarada && e.serviciosSinCobertura.length ? ` La declaración anterior cubría: ${e.serviciosSinCobertura.join(", ")}.` : ""),
        resolucion: "Revisar esos servicios, o declararlos expresamente como parte pendiente con «Declarar datos ausentes y limitaciones».",
      });
    }
    if (!limpio(a.responsableCalidad)) out.push({ texto: "Sin responsable de control de calidad.", resolucion: "Designar responsable de calidad en el paso G del onboarding." });
  }
  if (paso === "calidad" && e.estado !== "En revisión") {
    out.push({ texto: "La revisión de calidad solo se ejecuta sobre un diagnóstico enviado a revisión.", resolucion: "Enviar el diagnóstico a control de calidad primero." });
  }
  if (paso === "plan") {
    if (e.estado !== "Completado") out.push({ texto: `El diagnóstico no está completado (estado: ${e.estado}).`, resolucion: "Pasar el control de calidad antes de planificar." });
    if (e.revisiones.at(-1)?.resultado !== "Validado") out.push({ texto: "La última revisión de calidad no está validada.", resolucion: "Corregir lo devuelto y volver a pasar control de calidad." });
    if (e.planes.length) out.push({ texto: "Ya existe un plan para este encargo.", resolucion: "Abrir el plan y crear una versión nueva si hace falta cambiarlo." });
    if (!disp.length) out.push({ texto: "No hay hallazgos sin bloqueo con los que construir acciones.", resolucion: "Resolver los accesos bloqueados antes de planificar." });
    if (!e.objetivos) out.push({ texto: "Sin objetivos registrados: las acciones no podrían justificarse.", resolucion: "Completar los objetivos en el paso C del onboarding." });
  }
  return out;
}

function exigir(paso: Paso, e: Encargo, a: Alta) {
  const imp = impedimentos(paso, e, a);
  if (imp.length) {
    throw new ErrorSeo(`${TITULO_IMPEDIMENTO[paso]} ${imp.map((i) => `${i.texto} Cómo resolverlo: ${i.resolucion}`).join(" ")}`);
  }
}

export function encargoDe(d: Datos, id: string): { e: Encargo; a: Alta } {
  const e = d.encargos.find((x) => x.id === id);
  if (!e) throw new ErrorSeo("El encargo no existe.");
  const a = d.altas.find((x) => x.id === e.altaId);
  if (!a) throw new ErrorSeo("El alta del encargo no existe.");
  return { e, a };
}

// --- Pasos ------------------------------------------------------------------

export function iniciar(d: Datos, actor: Actor, id: string): void {
  const { e, a } = encargoDe(d, id);
  exigir("iniciar", e, a);
  e.estado = "En curso";
  e.historial.push(`${sello()} · Diagnóstico iniciado por ${actor.nombre} con los agentes asignados.`);
  const bl = bloqueos(e, a);
  if (bl.length) e.historial.push(`${sello()} · Trabajo dependiente de ${bl.map((b) => b.nombre).join(", ")} bloqueado; el resto continúa.`);
  registrar(d, { por: actor.nombre, clientId: e.clientId, especialidad: "Auditoría SEO", estado: bl.length ? "Bloqueo" : "Funcionamiento normal", texto: `Diagnóstico ${e.id} en curso${bl.length ? " con trabajo bloqueado por accesos" : ""}.`, enlace: rutaEncargo(e.clientId) });
}

/** El equipo registra lo comprobado en un hallazgo: sin fuente, fecha y referencia no cuenta. */
export function registrarEvidencia(
  d: Datos, actor: Actor, id: string, ref: string,
  x: { fuente: string; fecha: string; evidencia: string; impacto: string; limitaciones: string },
): void {
  const { e, a } = encargoDe(d, id);
  if (!enCurso(e, a)) throw new ErrorSeo("La evidencia se registra con el diagnóstico en curso.");
  const h = e.hallazgos.find((y) => y.ref === ref);
  if (!h) throw new ErrorSeo("El hallazgo no existe.");
  if (h.dep && a.accesos[h.dep] !== "Validado") {
    throw new ErrorSeo(`Bloqueado por ${nombreAcceso(h.dep)}: sin ese acceso no se mide nada ni se inventan cifras.`);
  }
  const fuente = limpio(x.fuente);
  const fecha = limpio(x.fecha);
  const evidencia = limpio(x.evidencia);
  if (!fuente || !fecha || !evidencia) throw new ErrorSeo("Hacen falta fuente, fecha y referencia de la evidencia.");
  Object.assign(h, { fuente, fecha, evidencia, impacto: limpio(x.impacto), limitaciones: limpio(x.limitaciones) });
  e.historial.push(`${sello()} · Evidencia registrada en ${h.ref} (${h.titulo}) por ${actor.nombre}.`);
}

export function declarar(d: Datos, actor: Actor, id: string): void {
  const { e, a } = encargoDe(d, id);
  exigir("declarar", e, a);
  if (bloqueos(e, a).length) e.limitacionesDeclaradas = true;
  const faltan = sinCobertura(e, a);
  if (faltan.length) {
    e.coberturaDeclarada = true;
    e.serviciosSinCobertura = faltan;
    e.historial.push(`${sello()} · Servicios contratados sin cobertura declarados como parte pendiente: ${faltan.join(", ")}.`);
  }
  e.historial.push(`${sello()} · Datos ausentes y limitaciones declarados por ${actor.nombre}.`);
}

export function enviarCalidad(d: Datos, actor: Actor, id: string): void {
  const { e, a } = encargoDe(d, id);
  exigir("enviar", e, a);
  e.estado = "En revisión";
  e.historial.push(`${sello()} · Diagnóstico enviado a control de calidad por ${actor.nombre}.`);
  registrar(d, { por: actor.nombre, clientId: e.clientId, especialidad: "Control de calidad", estado: "Aprobación pendiente", texto: `Diagnóstico ${e.id} en revisión de calidad.`, enlace: rutaEncargo(e.clientId) });
}

export function comprobacionesCalidad(e: Encargo, a: Alta): Comprobacion[] {
  const faltan = sinCobertura(e, a);
  const disp = disponibles(e, a);
  const bl = bloqueos(e, a);
  return [
    {
      texto: "Alcance cubierto por los hallazgos (uno por servicio contratado)",
      ok: coberturaOk(e, a),
      detalle: faltan.length
        ? `Sin cobertura propia: ${faltan.join(", ")}${coberturaOk(e, a) ? " · declarado como parte pendiente" : " · sin declarar"}`
        : `${e.servicios.join(", ")} con hallazgos con evidencia`,
    },
    {
      texto: "Cada hallazgo tiene evidencia, fuente y fecha",
      ok: disp.length > 0 && disp.every(completo),
      detalle: `${disp.filter(completo).length} de ${disp.length} hallazgos disponibles completos`,
    },
    {
      texto: "Datos ausentes y limitaciones declarados",
      ok: !bl.length || e.limitacionesDeclaradas,
      detalle: bl.length ? bl.map((b) => `${b.nombre} · ${b.estado}`).join(", ") : "Sin accesos bloqueantes",
    },
  ];
}

/** Revisión de calidad real: las tres comprobaciones deciden Validado o Devuelto. */
export function revisarCalidad(d: Datos, actor: Actor, id: string, comentario: string): void {
  exigirPM(actor, "revisar la calidad");
  const { e, a } = encargoDe(d, id);
  exigir("calidad", e, a);
  const comprobaciones = comprobacionesCalidad(e, a);
  const ok = comprobaciones.every((c) => c.ok);
  const n = e.revisiones.length + 1;
  e.revisiones.push({
    n,
    resultado: ok ? "Validado" : "Devuelto para corrección",
    comprobaciones,
    comentario: limpio(comentario) || (ok
      ? "Alcance, evidencias y limitaciones verificados por control de calidad."
      : `Corregir: ${comprobaciones.filter((c) => !c.ok).map((c) => c.texto.toLowerCase()).join("; ")}.`),
    por: actor.nombre,
    en: new Date().toISOString(),
  });
  e.estado = ok ? "Completado" : "En curso";
  e.historial.push(`${sello()} · Revisión ${n}: ${ok ? "Validado" : "Devuelto para corrección"}.`);
  registrar(d, { por: actor.nombre, clientId: e.clientId, especialidad: "Control de calidad", estado: ok ? "Acción completada" : "Revisión humana en curso", texto: `Revisión de calidad ${n} de ${e.id}: ${ok ? "validado" : "devuelto"}.`, enlace: rutaEncargo(e.clientId) });
}

// --- Plan de trabajo ---------------------------------------------------------

const AGENTE_DE: Record<ServicioAlta, Especialidad> = {
  SEO: "Estrategia y planificación",
  "SEO local": "Estrategia y planificación",
  "SEO técnico": "SEO técnico",
  Contenidos: "Contenidos",
  AEO: "AEO/GEO y citabilidad",
  GEO: "AEO/GEO y citabilidad",
};

function plazo(i: number): string {
  const f = new Date();
  f.setDate(f.getDate() + 4 * (i + 1));
  return f.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function acciones(e: Encargo, a: Alta): AccionPlan[] {
  return disponibles(e, a).filter(completo).map((h, i) => ({
    n: i + 1,
    accion: `Resolver: ${h.titulo}`,
    justifica: `Hallazgo ${h.ref} (${h.evidencia}) · objetivo: ${e.objetivos || "objetivo pendiente de definir"}`,
    entregable: h.servicio === "Contenidos" ? "Borradores con fuentes citadas" : h.servicio === "SEO técnico" ? "Mapa de cambios técnicos" : "Ficha de recomendaciones con evidencia",
    criterio: h.prioridad === "Alta" ? "Hallazgo verificado como resuelto con evidencia posterior" : "Entregable revisado por control de calidad sin devoluciones",
    agente: AGENTE_DE[h.servicio],
    dependencias: i === 0 ? "Diagnóstico validado" : `Acción ${i} entregada`,
    plazo: plazo(i),
    esfuerzo: "Por estimar",
    aprobacion: h.servicio === "Contenidos" ? "Aprobación del cliente antes de publicar" : "Autorización del PM",
  }));
}

const excluidas = (e: Encargo, a: Alta) =>
  bloqueos(e, a).flatMap((b) => b.afectados.map((t) => `${t} · bloqueado por ${b.nombre}`));

export function generarPlan(d: Datos, actor: Actor, id: string): PlanTrabajo {
  const { e, a } = encargoDe(d, id);
  exigir("plan", e, a);
  const p: PlanTrabajo = {
    version: 1, estado: "Pendiente de aprobación", creadoEn: new Date().toISOString(),
    motivo: `Generado desde el diagnóstico validado el ${sello()}.`,
    acciones: acciones(e, a), excluidas: excluidas(e, a), decisiones: [],
  };
  e.planes.push(p);
  e.historial.push(`${sello()} · Plan v1 generado y enviado al Project Manager.`);
  registrar(d, { por: actor.nombre, clientId: e.clientId, especialidad: "Estrategia y planificación", estado: "Aprobación pendiente", texto: `Plan v1 de ${e.id} pendiente de decisión del PM.`, enlace: rutaPlan(e.id) });
  return p;
}

export const rutaPlan = (encargoId: string) => `/app/seo/plan/${encargoId}`;

export function decidirPlan(
  d: Datos, actor: Actor, id: string, tipo: "Aprobado" | "Cambios solicitados" | "Rechazado", comentario: string,
): void {
  exigirPM(actor, "decidir sobre un plan");
  const { e } = encargoDe(d, id);
  const p = ultimoPlan(e);
  if (!p) throw new ErrorSeo("El encargo no tiene plan.");
  if (p.estado !== "Pendiente de aprobación") throw new ErrorSeo("Esta versión ya tiene decisión. Crea una versión nueva para cambiarla.");
  const texto = limpio(comentario);
  if (tipo !== "Aprobado" && !texto) {
    throw new ErrorSeo("Falta el comentario o el motivo de la decisión. Escribir qué debe cambiar o por qué se rechaza, con detalle suficiente para trabajar.");
  }
  if (tipo !== "Aprobado" && texto.length < 12) {
    throw new ErrorSeo(`El motivo es demasiado breve (${texto.length} caracteres) y no sirve como instrucción. Ampliar a 12 caracteres como mínimo.`);
  }
  if (texto.length > 500) throw new ErrorSeo("El comentario supera los 500 caracteres permitidos.");
  p.estado = tipo === "Aprobado" ? "Listo para ejecución" : tipo;
  p.decisiones.push({ tipo, comentario: texto || "Sin observaciones.", por: actor.nombre, en: new Date().toISOString(), version: p.version });
  e.historial.push(`${sello()} · Decisión de ${actor.nombre} sobre el plan v${p.version}: ${tipo}.`);
  registrar(d, { por: actor.nombre, clientId: e.clientId, especialidad: "Estrategia y planificación", estado: tipo === "Aprobado" ? "Acción completada" : "Revisión humana en curso", texto: `Plan v${p.version} de ${e.id}: ${tipo.toLowerCase()}.`, enlace: rutaPlan(e.id) });
}

/** Una versión nueva, pendiente de revisión: la aprobación anterior no la cubre. */
export function nuevaVersion(d: Datos, actor: Actor, id: string): PlanTrabajo {
  exigirPM(actor, "crear versiones del plan");
  const { e, a } = encargoDe(d, id);
  const p = ultimoPlan(e);
  if (!p) throw new ErrorSeo("El encargo no tiene plan.");
  if (p.estado === "Pendiente de aprobación") throw new ErrorSeo("La versión actual aún espera decisión.");
  const ultima = p.decisiones.at(-1);
  const nueva: PlanTrabajo = {
    version: p.version + 1, estado: "Pendiente de aprobación", creadoEn: new Date().toISOString(),
    motivo: `Nueva versión tras la decisión sobre v${p.version}: ${ultima?.tipo.toLowerCase() ?? "cambios"}.`,
    acciones: acciones(e, a), excluidas: excluidas(e, a), decisiones: [],
  };
  e.planes.push(nueva);
  e.historial.push(`${sello()} · Plan v${nueva.version} creado por ${actor.nombre}; pendiente de revisión.`);
  return nueva;
}

// --- Accesos después de activar ---------------------------------------------

/**
 * Cambiar un acceso reanuda o detiene solo el trabajo que dependía de él. Nunca se
 * piden contraseñas, claves ni tokens: solo el estado del permiso.
 */
export function actualizarAcceso(d: Datos, actor: Actor, altaId: string, acceso: AccesoId, estado: EstadoAcceso): string {
  const a = d.altas.find((x) => x.id === altaId);
  if (!a) throw new ErrorSeo("El alta no existe.");
  const antes = a.accesos[acceso];
  if (antes === estado) return "Sin cambios.";
  a.accesos[acceso] = estado;
  const linea = `${sello()} · Acceso ${nombreAcceso(acceso)}: ${antes} → ${estado} (registrado por ${actor.nombre}).`;
  a.historial.push(linea);
  const e = d.encargos.find((x) => x.altaId === a.id);
  if (!e) return `Acceso ${nombreAcceso(acceso)} actualizado a ${estado}.`;
  e.historial.push(linea);

  const afectados = e.hallazgos.filter((h) => h.dep === acceso).map((h) => h.titulo);
  const bl = bloqueos(e, a);
  let reanudados = 0;
  if (estado === "Validado") {
    if (afectados.length) {
      reanudados = afectados.length;
      e.historial.push(`${sello()} · Trabajo reanudado en: ${afectados.join(", ")}.`);
    }
    if (e.estado === "Bloqueado" && !bl.length) {
      e.estado = "En curso";
      e.historial.push(`${sello()} · Encargo de nuevo «En curso»: no quedan accesos bloqueantes.`);
    }
    const p = ultimoPlan(e);
    if (p && p.excluidas.some((x) => x.endsWith(nombreAcceso(acceso)))) {
      e.historial.push(`${sello()} · El plan v${p.version} excluyó trabajo por este acceso: requiere una versión nueva para incorporarlo.`);
    }
  } else if (afectados.length) {
    e.historial.push(`${sello()} · Trabajo de nuevo bloqueado en: ${afectados.join(", ")}. Requiere resolver el acceso.`);
    e.limitacionesDeclaradas = false;
    if (["En curso", "En revisión", "Completado", "Bloqueado"].includes(e.estado)) {
      const quedan = disponibles(e, a).length > 0;
      e.estado = quedan ? "En curso" : "Bloqueado";
      e.historial.push(quedan
        ? `${sello()} · Encargo «En curso» con alcance reducido: se detiene solo lo que dependía de ${nombreAcceso(acceso)}; hay que declarar las limitaciones antes de enviarlo a calidad.`
        : `${sello()} · Encargo «Bloqueado»: sin ese acceso no queda ningún hallazgo ejecutable.`);
    }
  }
  if (!bl.length) e.limitacionesDeclaradas = false;
  const faltan = sinCobertura(e, a);
  if (!faltan.length) {
    e.coberturaDeclarada = false;
    e.serviciosSinCobertura = [];
  } else if (e.coberturaDeclarada && !faltan.every((s) => e.serviciosSinCobertura.includes(s))) {
    e.coberturaDeclarada = false;
    e.serviciosSinCobertura = [];
    e.historial.push(`${sello()} · La declaración de cobertura queda sin efecto: ahora falta cobertura en ${faltan.join(", ")}. Hay que declararlo de nuevo antes de enviar a calidad.`);
  }
  registrar(d, {
    por: actor.nombre, clientId: e.clientId, especialidad: "Onboarding y accesos",
    estado: estado === "Validado" ? "Acción completada" : "Bloqueo",
    texto: `Acceso ${nombreAcceso(acceso)} de ${e.id}: ${antes} → ${estado}.`, enlace: `/app/seo/clientes/${e.clientId}?tab=accesos`,
  });
  return `Acceso ${nombreAcceso(acceso)} actualizado a ${estado}.` +
    (reanudados ? ` Trabajo reanudado en ${reanudados} hallazgo(s).` : "") +
    (bl.length ? ` Siguen bloqueados: ${bl.map((b) => b.nombre).join(", ")}.` : " No quedan accesos bloqueantes.");
}
