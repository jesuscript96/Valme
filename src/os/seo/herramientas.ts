import type { Auditoria as ResultadoMotor, Funcion, Gravedad } from "@/os/audit/types";
import { calcularCobertura, serviciosSinCubrir } from "./cobertura";
import {
  BORRA_AUTORIZACION, PIDE_MOTIVO, SOLO_PM, puedePasar, seguimientoAbierto, soloLectura,
} from "./estados";
import { PILOTO, PILOTO_DOMINIOS } from "./piloto";
import {
  AGENTES, DECISION_LABEL, ESTADO_LABEL, SERVICIOS, TIPO_TAREA_LABEL,
  type Actor, type Auditoria, type Datos, type Decision, type EstadoAuditoria,
  type EstadoTarea, type Hallazgo, type MedicionGeo, type Prioridad, type Proyecto, type Servicio,
  type Tarea, type TipoTarea,
} from "./tipos";

/**
 * HERRAMIENTAS DEL MÓDULO SEO.
 *
 * Todo es una herramienta: una entrada, una salida. Trabajan sobre `Datos` (que hoy
 * vive en memoria) y sobre quién actúa; no saben de pantallas, de sesiones ni de
 * dónde se guardan las cosas. Las llaman las server actions y las podrá llamar el
 * asistente. Cada regla de negocio de Search OS vive aquí, no en los botones.
 */

/** Error con un mensaje que se puede enseñar tal cual a quien usa la herramienta. */
export class ErrorSeo extends Error {}

const ahora = () => new Date().toISOString();
const id = (prefijo: string) => `${prefijo}_${crypto.randomUUID().slice(0, 8)}`;
const limpio = (s: string | undefined | null) => (s ?? "").trim();

function exigirPM(actor: Actor, que: string) {
  if (!actor.pm) throw new ErrorSeo(`Solo un PM (admin o estratega) puede ${que}.`);
}

function auditoria(d: Datos, auditoriaId: string, clientId?: string): Auditoria {
  const a = d.auditorias.find((x) => x.id === auditoriaId);
  if (!a || (clientId && a.clientId !== clientId)) {
    throw new ErrorSeo("La auditoría no existe o no es de este cliente.");
  }
  return a;
}

function editable(a: Auditoria) {
  if (soloLectura(a)) {
    throw new ErrorSeo("La auditoría está cerrada o archivada y no admite cambios.");
  }
}

function seguimiento(a: Auditoria) {
  if (!seguimientoAbierto(a)) {
    throw new ErrorSeo("La auditoría está cancelada o archivada: el seguimiento está cerrado.");
  }
}

function anotar(d: Datos, a: Auditoria, actor: Actor, texto: string) {
  a.actualizadaEn = ahora();
  d.eventos.push({ id: id("ev"), auditoriaId: a.id, en: a.actualizadaEn, por: actor.nombre, texto });
}

export function normalizarDominio(entrada: string): string {
  const texto = limpio(entrada).toLowerCase();
  if (!texto) throw new ErrorSeo("Indica el dominio.");
  try {
    const url = new URL(texto.includes("://") ? texto : `https://${texto}`);
    if (!url.hostname.includes(".")) throw new Error();
    return url.hostname;
  } catch {
    throw new ErrorSeo("El dominio no es válido. Ejemplo: www.ejemplo.com");
  }
}

// --- Proyectos -------------------------------------------------------------

export function crearProyecto(
  d: Datos, actor: Actor, clientId: string, input: { nombre: string; dominio: string },
): Proyecto {
  exigirPM(actor, "crear proyectos");
  const nombre = limpio(input.nombre);
  if (!nombre) throw new ErrorSeo("Pon un nombre al proyecto.");
  const dominio = normalizarDominio(input.dominio);
  if (d.proyectos.some((p) => p.clientId === clientId && p.dominio === dominio)) {
    throw new ErrorSeo("Este cliente ya tiene un proyecto con ese dominio.");
  }
  const proyecto = { id: id("pr"), clientId, nombre, dominio, creadoEn: ahora() };
  d.proyectos.push(proyecto);
  return proyecto;
}

// --- Auditorías ------------------------------------------------------------

export type NuevaAuditoria = {
  proyectoId: string;
  servicios: string[];
  alcance: string;
  paginas: number;
  minutos: number;
  costeEur: number;
};

export function crearAuditoria(
  d: Datos, actor: Actor, clientId: string, input: NuevaAuditoria,
): Auditoria {
  const proyecto = d.proyectos.find((p) => p.id === input.proyectoId && p.clientId === clientId);
  if (!proyecto) throw new ErrorSeo("Elige un proyecto de este cliente.");
  const servicios = SERVICIOS.filter((s) => input.servicios.includes(s));
  if (!servicios.length) throw new ErrorSeo("Marca al menos un servicio.");
  const alcance = limpio(input.alcance);
  if (!alcance) throw new ErrorSeo("Describe el alcance y las exclusiones.");
  const { paginas, minutos, costeEur } = input;
  if (!(paginas > 0 && paginas <= 10_000) || !(minutos > 0 && minutos <= 1_440)) {
    throw new ErrorSeo("Páginas y duración tienen que ser positivas y razonables.");
  }
  if (!(costeEur >= 0)) throw new ErrorSeo("El coste máximo no puede ser negativo.");

  const año = new Date().getFullYear();
  const n =
    Math.max(0, ...d.auditorias.filter((a) => a.ref.startsWith(`AUD-${año}-`)).map((a) => Number(a.ref.split("-")[2]))) + 1;
  const creada = ahora();
  const a: Auditoria = {
    id: id("au"),
    ref: `AUD-${año}-${String(n).padStart(3, "0")}`,
    clientId,
    proyectoId: proyecto.id,
    dominio: proyecto.dominio,
    estado: "borrador",
    servicios,
    alcance,
    limites: { paginas, minutos, costeEur },
    solicitadaPor: actor.nombre,
    creadaEn: creada,
    actualizadaEn: creada,
    autorizacion: null,
    motivo: null,
    archivadaEn: null,
    archivadaPor: null,
  };
  d.auditorias.push(a);
  anotar(d, a, actor, "Borrador registrado. No se ha iniciado ninguna ejecución.");
  return a;
}

/** Cambiar el alcance solo se puede en borrador o devuelto. */
export function editarAlcance(
  d: Datos, actor: Actor, auditoriaId: string, input: Omit<NuevaAuditoria, "proyectoId">,
): void {
  const a = auditoria(d, auditoriaId);
  editable(a);
  if (a.estado !== "borrador" && a.estado !== "devuelto") {
    throw new ErrorSeo("El alcance solo se cambia en borrador o devuelto.");
  }
  const servicios = SERVICIOS.filter((s) => input.servicios.includes(s));
  if (!servicios.length || !limpio(input.alcance)) {
    throw new ErrorSeo("Hacen falta servicios y alcance.");
  }
  a.servicios = servicios;
  a.alcance = limpio(input.alcance);
  a.limites = { paginas: input.paginas, minutos: input.minutos, costeEur: input.costeEur };
  a.autorizacion = null;
  anotar(d, a, actor, "Alcance modificado. La autorización anterior deja de valer.");
}

export function cambiarEstado(
  d: Datos, actor: Actor, auditoriaId: string,
  input: { a: EstadoAuditoria; motivo?: string; referencia?: string },
): void {
  const a = auditoria(d, auditoriaId);
  editable(a);
  const destino = input.a;
  if (!puedePasar(a.estado, destino)) {
    throw new ErrorSeo(`No se puede pasar de ${ESTADO_LABEL[a.estado]} a ${ESTADO_LABEL[destino]}.`);
  }
  if (SOLO_PM.includes(destino)) exigirPM(actor, `pasar a ${ESTADO_LABEL[destino].toLowerCase()}`);

  const motivo = limpio(input.motivo);
  if (PIDE_MOTIVO.includes(destino) && !motivo) {
    throw new ErrorSeo(`Para ${ESTADO_LABEL[destino].toLowerCase()} hay que escribir el motivo.`);
  }

  if (destino === "autorizado") {
    const referencia = limpio(input.referencia);
    if (!referencia) {
      throw new ErrorSeo("Autorizar exige una referencia: el correo, la reunión o el contrato.");
    }
    a.autorizacion = { por: actor.nombre, en: ahora(), referencia };
  }

  if (destino === "en_cola" || destino === "en_ejecucion") {
    if (!a.autorizacion) throw new ErrorSeo("La auditoría necesita una autorización vigente.");
  }

  if (destino === "control_calidad" || destino === "validado") {
    const cobertura = calcularCobertura(a, d.hallazgos, d.evidencias, d.declaraciones);
    const faltan = serviciosSinCubrir(cobertura);
    if (faltan.length) {
      throw new ErrorSeo(
        `Sin evidencia ni declaración en: ${faltan.join(", ")}. Decláralo en la pestaña Cobertura.`,
      );
    }
  }

  if (BORRA_AUTORIZACION.includes(destino)) a.autorizacion = null;
  a.motivo = PIDE_MOTIVO.includes(destino) ? motivo : a.motivo;
  const desde = a.estado;
  a.estado = destino;
  anotar(
    d, a, actor,
    `${ESTADO_LABEL[desde]} → ${ESTADO_LABEL[destino]}` +
      (destino === "autorizado" ? ` · referencia: ${a.autorizacion?.referencia}` : "") +
      (motivo ? ` · motivo: ${motivo}` : ""),
  );
}

export function archivarAuditoria(
  d: Datos, actor: Actor, auditoriaId: string, archivar: boolean,
): void {
  exigirPM(actor, archivar ? "archivar" : "restaurar");
  const a = auditoria(d, auditoriaId);
  if (archivar === Boolean(a.archivadaEn)) return;
  a.archivadaEn = archivar ? ahora() : null;
  a.archivadaPor = archivar ? actor.nombre : null;
  anotar(
    d, a, actor,
    archivar
      ? "Archivada: fuera del trabajo diario y en solo lectura."
      : `Restaurada en su estado actual (${ESTADO_LABEL[a.estado]}).`,
  );
}

// --- Evidencias y hallazgos ------------------------------------------------

/** El piloto de VALME solo se puede cargar en una auditoría de valmesolutions.com. */
export const admitePiloto = (a: Pick<Auditoria, "dominio">) => PILOTO_DOMINIOS.includes(a.dominio);

/** Importa la revisión externa. Idempotente: evidencias por URL y hallazgos por título. */
export function importarPiloto(
  d: Datos, actor: Actor, auditoriaId: string,
): { evidencias: number; hallazgos: number } {
  const a = auditoria(d, auditoriaId);
  editable(a);
  if (!admitePiloto(a)) throw new ErrorSeo("La revisión de VALME solo aplica a valmesolutions.com.");

  const porClave = new Map<string, string>();
  let nuevasE = 0;
  for (const e of PILOTO.evidencias) {
    const existente = d.evidencias.find((x) => x.auditoriaId === a.id && x.recurso === e.url);
    if (existente) {
      porClave.set(e.clave, existente.id);
      continue;
    }
    const nueva = {
      id: id("evi"), auditoriaId: a.id, recurso: e.url, fuente: PILOTO.revisor,
      metodo: PILOTO.metodo, observado: e.observado, observadoEn: PILOTO.observadoEn, externa: true,
    };
    d.evidencias.push(nueva);
    porClave.set(e.clave, nueva.id);
    nuevasE++;
  }

  let nuevosH = 0;
  for (const h of PILOTO.hallazgos) {
    const titulo = h.titulo.trim().toLowerCase();
    if (d.hallazgos.some((x) => x.auditoriaId === a.id && x.titulo.toLowerCase() === titulo)) continue;
    d.hallazgos.push({
      id: id("ha"), auditoriaId: a.id, categoria: h.categoria, servicio: h.servicio,
      titulo: h.titulo, descripcion: h.descripcion, prioridad: h.prioridad, impacto: h.impacto,
      recomendacion: h.recomendacion, confianza: h.confianza, fuentes: h.fuentes,
      evidencias: h.claves.map((k) => porClave.get(k)).filter((x): x is string => Boolean(x)),
      limitaciones: h.limitaciones, responsable: PILOTO.revisor, creadoEn: ahora(),
      decision: { valor: "pendiente", nota: "", por: null, en: null },
    });
    nuevosH++;
  }
  anotar(d, a, actor, `Revisión externa cargada: ${nuevosH} hallazgos y ${nuevasE} evidencias nuevos.`);
  return { evidencias: nuevasE, hallazgos: nuevosH };
}

const PRIORIDAD_DE: Record<Gravedad, Prioridad> = { p0: "critica", p1: "alta", p2: "media", p3: "baja" };

function servicioDe(funcion: Funcion, clave: string): Servicio {
  if (/llms|geo|aeo|ia\b|bots/i.test(clave)) return "AEO/GEO";
  if (funcion === 6) return "Contenidos";
  if (funcion === 8) return "Analítica";
  return "SEO técnico";
}

function categoriaDe(funcion: Funcion, clave: string): string {
  if (/jsonld|schema/i.test(clave)) return "schema_org";
  if (/llms|geo|aeo|bots/i.test(clave)) return "aeo_geo_citabilidad";
  if (/robots|sitemap|404|canonical|index/i.test(clave)) return "indexacion";
  if (funcion === 6) return "contenido";
  if (funcion === 7) return "rendimiento";
  if (funcion === 8) return "analitica";
  return "seo_tecnico";
}

const valorTexto = (v: unknown) =>
  v === null || v === undefined ? "sin dato" : Array.isArray(v) ? v.join(", ") || "ninguno" : String(v);

/**
 * Guarda el resultado del motor de auditoría de Valme: las señales como evidencias y los
 * hallazgos (no los positivos) como hallazgos pendientes de decisión.
 */
export function registrarEjecucion(
  d: Datos, actor: Actor, auditoriaId: string, r: ResultadoMotor,
): { evidencias: number; hallazgos: number; noDisponibles: number } {
  const a = auditoria(d, auditoriaId);
  editable(a);
  if (a.estado !== "en_ejecucion") throw new ErrorSeo("Solo se ejecuta una auditoría en ejecución.");

  const porSeñal = new Map<string, string>();
  for (const s of r.señales) {
    if (s.estado !== "verificado" && s.estado !== "parcial") continue;
    const e = {
      id: id("evi"), auditoriaId: a.id, recurso: s.url ?? r.urlFinal, fuente: s.fuente,
      metodo: `Motor Valme · ${s.id}`,
      observado: `${s.que}: ${valorTexto(s.valor)}${s.limite ? ` (${s.limite})` : ""}`.slice(0, 4000),
      observadoEn: s.observadoEn, externa: true,
    };
    d.evidencias.push(e);
    porSeñal.set(s.id, e.id);
  }

  let nuevos = 0;
  for (const h of r.hallazgos) {
    if (h.positivo) continue;
    if (d.hallazgos.some((x) => x.auditoriaId === a.id && x.titulo === h.titulo)) continue;
    const citadas = r.señales.filter((s) => h.evidencia.includes(s.id));
    d.hallazgos.push({
      id: id("ha"), auditoriaId: a.id, categoria: categoriaDe(h.funcion, h.id),
      servicio: servicioDe(h.funcion, h.id), titulo: h.titulo, descripcion: h.situacion,
      prioridad: PRIORIDAD_DE[h.gravedad], impacto: h.consecuencia, recomendacion: h.solucion,
      confianza: h.confianza, fuentes: [...new Set(citadas.map((s) => s.fuente))],
      evidencias: h.evidencia.map((sid) => porSeñal.get(sid)).filter((x): x is string => Boolean(x)),
      limitaciones: r.fuentesNoDisponibles.map((f) => `${f.fuente}: ${f.motivo}`),
      responsable: "Motor de auditoría Valme", creadoEn: ahora(),
      decision: { valor: "pendiente", nota: "", por: null, en: null },
    });
    nuevos++;
  }
  anotar(
    d, a, actor,
    `Ejecución del motor: ${porSeñal.size} evidencias y ${nuevos} hallazgos nuevos` +
      (r.fuentesNoDisponibles.length
        ? ` · no disponible: ${r.fuentesNoDisponibles.map((f) => `${f.fuente} (${f.motivo})`).join("; ")}`
        : ""),
  );
  return { evidencias: porSeñal.size, hallazgos: nuevos, noDisponibles: r.fuentesNoDisponibles.length };
}

function hallazgo(d: Datos, hallazgoId: string, clientId?: string): { h: Hallazgo; a: Auditoria } {
  const h = d.hallazgos.find((x) => x.id === hallazgoId);
  if (!h) throw new ErrorSeo("El hallazgo no existe.");
  return { h, a: auditoria(d, h.auditoriaId, clientId) };
}

export function decidirHallazgo(
  d: Datos, actor: Actor, hallazgoId: string, input: { decision: Decision; nota?: string },
  clientId?: string,
): void {
  exigirPM(actor, "decidir sobre un hallazgo");
  const { h, a } = hallazgo(d, hallazgoId, clientId);
  seguimiento(a);
  const nota = limpio(input.nota);
  if (input.decision === "descartar" && !nota) {
    throw new ErrorSeo("Para descartar un hallazgo escribe el motivo en la nota.");
  }
  h.decision = { valor: input.decision, nota, por: actor.nombre, en: ahora() };
  anotar(d, a, actor, `Decisión sobre «${h.titulo}»: ${DECISION_LABEL[input.decision]}`);
}

export function declararCobertura(
  d: Datos, actor: Actor, auditoriaId: string,
  input: { servicio: string; estado: "ausencia_declarada" | "pendiente_justificado"; motivo: string },
): void {
  const a = auditoria(d, auditoriaId);
  editable(a);
  const servicio = a.servicios.find((s) => s === input.servicio);
  if (!servicio) throw new ErrorSeo("Ese servicio no está contratado en la auditoría.");
  const motivo = limpio(input.motivo);
  if (!motivo) throw new ErrorSeo("La declaración necesita un motivo.");
  d.declaraciones = d.declaraciones.filter((x) => !(x.auditoriaId === a.id && x.servicio === servicio));
  d.declaraciones.push({ auditoriaId: a.id, servicio, estado: input.estado, motivo, por: actor.nombre, en: ahora() });
  anotar(d, a, actor, `Cobertura declarada en ${servicio}: ${motivo}`);
}

// --- Tareas de seguimiento -------------------------------------------------

export type NuevaTarea = {
  tipo: TipoTarea;
  titulo: string;
  detalle: string;
  criterio?: string;
  responsableId: string;
  agenteId?: string;
  fecha?: string;
};

/** `responsables`: ids de quienes pueden ser responsables (PM con acceso al cliente). */
export function crearTarea(
  d: Datos, actor: Actor, hallazgoId: string, input: NuevaTarea, responsables: string[],
  clientId?: string,
): Tarea {
  const { h, a } = hallazgo(d, hallazgoId, clientId);
  seguimiento(a);
  const titulo = limpio(input.titulo);
  const detalle = limpio(input.detalle);
  if (!titulo || !detalle) throw new ErrorSeo("La tarea necesita título y detalle.");
  if (!responsables.includes(input.responsableId)) {
    throw new ErrorSeo("El responsable de una tarea debe ser un PM con acceso a este cliente.");
  }
  const agenteId = input.agenteId || null;
  if (agenteId && !AGENTES.some((x) => x.id === agenteId)) throw new ErrorSeo("Ese agente no existe.");
  const fecha = limpio(input.fecha) || null;
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new ErrorSeo("La fecha no es válida.");

  const tarea: Tarea = {
    id: id("ta"), auditoriaId: a.id, hallazgoId: h.id, tipo: input.tipo, titulo, detalle,
    criterio: limpio(input.criterio), responsableId: input.responsableId, agenteId, fecha,
    estado: "pendiente", conclusion: "", resultado: null, creadaPor: actor.nombre,
    creadaEn: ahora(), cerradaPor: null, cerradaEn: null,
  };
  d.tareas.push(tarea);
  anotar(d, a, actor, `${TIPO_TAREA_LABEL[tarea.tipo]} creada: ${titulo}`);
  return tarea;
}

/**
 * Mueve una tarea. Una tarea cerrada no cambia. Cerrar una investigación exige su
 * conclusión y puede decidir el hallazgo en el mismo paso (priorizar o descartar).
 */
export function actualizarTarea(
  d: Datos, actor: Actor, tareaId: string,
  input: { estado: EstadoTarea; conclusion?: string; resultado?: "priorizar" | "descartar" | "" },
  clientId?: string,
): void {
  const t = d.tareas.find((x) => x.id === tareaId);
  if (!t) throw new ErrorSeo("La tarea no existe.");
  const a = auditoria(d, t.auditoriaId, clientId);
  seguimiento(a);
  if (t.estado === "hecha" || t.estado === "cancelada") {
    throw new ErrorSeo("La tarea está cerrada y ya no admite cambios.");
  }
  const cierra = input.estado === "hecha";
  const conclusion = limpio(input.conclusion);
  if (cierra && t.tipo === "investigacion" && !conclusion) {
    throw new ErrorSeo("Para cerrar una investigación escribe su conclusión.");
  }
  const resultado = cierra && t.tipo === "investigacion" && input.resultado ? input.resultado : null;
  if (resultado) {
    // La decisión va primero: si quien cierra no es PM, la tarea no queda cerrada a medias.
    decidirHallazgo(d, actor, t.hallazgoId, { decision: resultado, nota: conclusion }, clientId);
  }
  t.estado = input.estado;
  if (cierra || input.estado === "cancelada") {
    t.conclusion = conclusion || (cierra ? "Hecho." : "");
    t.resultado = resultado;
    t.cerradaPor = actor.nombre;
    t.cerradaEn = ahora();
  }
  anotar(d, a, actor, `Tarea «${t.titulo}»: ${input.estado.replace("_", " ")}`);
}

// --- Visibilidad en IA (GEO) -----------------------------------------------

/** Guarda una medición GEO a partir de lo que devuelve la herramienta «geo» del motor. */
export function registrarMedicionGeo(
  d: Datos, actor: Actor, proyectoId: string, r: ResultadoMotor,
): MedicionGeo {
  const proyecto = d.proyectos.find((p) => p.id === proyectoId);
  if (!proyecto) throw new ErrorSeo("El proyecto no existe.");
  const señal = (id: string) => r.señales.find((s) => s.id === id);
  const lista = (id: string) => {
    const v = señal(id)?.valor;
    return Array.isArray(v) ? v.map(String) : [];
  };
  const menciones = señal("geo.menciones");
  const medida = menciones?.estado === "verificado" && typeof menciones.valor === "number";
  const m: MedicionGeo = {
    id: id("geo"), proyectoId, clientId: proyecto.clientId, en: ahora(), por: actor.nombre,
    estado: medida ? "medida" : "no_disponible",
    categoria: typeof señal("geo.categoria")?.valor === "string" ? (señal("geo.categoria")?.valor as string) : null,
    consultas: lista("geo.consultas"),
    menciones: medida ? (menciones?.valor as number) : 0,
    posicion: typeof señal("geo.posicion")?.valor === "number" ? (señal("geo.posicion")?.valor as number) : null,
    competidores: lista("geo.competidores"),
    motivo: medida
      ? null
      : r.fuentesNoDisponibles.map((f) => `${f.fuente}: ${f.motivo}`).join(" ") ||
        menciones?.limite || "No se pudo medir.",
  };
  d.mediciones.push(m);
  return m;
}

// --- Agente de investigación ----------------------------------------------

/**
 * Reserva una tarea de investigación para el agente HTTP. La reserva es el cambio a
 * «en curso»: una segunda petición sobre la misma tarea ya no la encuentra pendiente.
 */
export function reservarParaAgente(
  d: Datos, actor: Actor, tareaId: string, clientId?: string,
): { url: string } {
  exigirPM(actor, "lanzar el agente");
  const t = d.tareas.find((x) => x.id === tareaId);
  if (!t) throw new ErrorSeo("La tarea no existe.");
  const a = auditoria(d, t.auditoriaId, clientId);
  editable(a);
  if (t.tipo !== "investigacion" || t.estado !== "pendiente") {
    throw new ErrorSeo("El agente solo trabaja sobre investigaciones pendientes.");
  }
  if (a.estado !== "en_ejecucion" || !a.autorizacion) {
    throw new ErrorSeo("La auditoría tiene que estar autorizada y en ejecución.");
  }
  t.estado = "en_curso";
  t.conclusion = "Prueba HTTP iniciada; pendiente de resultado y revisión del PM.";
  anotar(d, a, actor, `Agente HTTP lanzado sobre «${t.titulo}»`);
  return { url: `https://${a.dominio}/` };
}

export function registrarSondeo(
  d: Datos, actor: Actor, tareaId: string, resultado: { ok: true; observado: string; url: string } | { ok: false },
): void {
  const t = d.tareas.find((x) => x.id === tareaId);
  if (!t || t.estado !== "en_curso") return;
  const a = auditoria(d, t.auditoriaId);
  if (!resultado.ok) {
    t.conclusion = "La prueba no pudo completarse. No se reintenta sola: revisa la tarea antes de cerrarla.";
    anotar(d, a, actor, `Agente HTTP sin resultado en «${t.titulo}»`);
    return;
  }
  const e = {
    id: id("evi"), auditoriaId: a.id, recurso: resultado.url, fuente: "Agente HTTP Valme v1",
    metodo: `HTTPS GET sin redirecciones · tarea ${t.id}`, observado: resultado.observado,
    observadoEn: ahora(), externa: true,
  };
  d.evidencias.push(e);
  const h = d.hallazgos.find((x) => x.id === t.hallazgoId);
  if (h) h.evidencias.push(e.id);
  t.conclusion =
    "Prueba HTTP completada y enlazada al hallazgo. No cierra la investigación: revisa la evidencia.";
  anotar(d, a, actor, `Agente HTTP completado en «${t.titulo}»`);
}
