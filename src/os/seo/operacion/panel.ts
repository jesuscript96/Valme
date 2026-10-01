import { soloLectura } from "../estados";
import { AGENTES, type Datos, type Tarea } from "../tipos";
import { bloqueos, ultimoPlan } from "./diagnostico";
import { estadoInforme, rutaInforme } from "./informes";
import { puedeActivar, rutaAlta } from "./onboarding";
import { ESPECIALIDADES, type Especialidad } from "./tipos";

/**
 * VISTAS CALCULADAS DEL MÓDULO: cola de supervisión, carga de agentes, ciclo e
 * indicadores. Nada está fijado a mano: todo sale de las auditorías, altas, encargos,
 * planes, tareas, informes y del registro de actividad.
 */

export type TipoSupervision = "Aprobación" | "Bloqueo" | "Riesgo";
export type ElementoSupervision = {
  id: string;
  tipo: TipoSupervision;
  titulo: string;
  detalle: string;
  clientId: string;
  especialidad: Especialidad;
  estado: string;
  vence: string | null;
  enlace: string;
};

const hoy = () => new Date().toISOString().slice(0, 10);
const vencida = (t: Tarea) => (t.estado === "pendiente" || t.estado === "en_curso") && Boolean(t.fecha) && (t.fecha as string) < hoy();
export const especialidadDeAgente = (agenteId: string | null): Especialidad | null =>
  (AGENTES.find((a) => a.id === agenteId)?.especialidad as Especialidad | undefined) ?? null;

/** Decisiones, no tareas: lo que espera a una persona, por tipo y con su enlace. */
export function colaSupervision(d: Datos, clientes: Set<string>): ElementoSupervision[] {
  const out: ElementoSupervision[] = [];
  const add = (x: Omit<ElementoSupervision, "id">) => out.push({ ...x, id: `${x.tipo}:${x.enlace}:${x.titulo}` });

  for (const a of d.auditorias.filter((x) => clientes.has(x.clientId) && !x.archivadaEn)) {
    const enlace = `/app/seo/auditorias/${a.id}`;
    if (a.estado === "pendiente_autorizacion") add({ tipo: "Aprobación", titulo: `Autorizar el alcance de ${a.ref}`, detalle: `${a.dominio} · ${a.servicios.join(", ")}`, clientId: a.clientId, especialidad: "Auditoría SEO", estado: "Aprobación pendiente", vence: null, enlace });
    if (a.estado === "control_calidad") add({ tipo: "Aprobación", titulo: `Validar la auditoría ${a.ref}`, detalle: "Revisar cobertura, fuentes y limitaciones", clientId: a.clientId, especialidad: "Control de calidad", estado: "Aprobación pendiente", vence: null, enlace });
    if (a.estado === "bloqueado") add({ tipo: "Bloqueo", titulo: `${a.ref} bloqueada`, detalle: a.motivo ?? "Sin motivo", clientId: a.clientId, especialidad: "Auditoría SEO", estado: "Bloqueo", vence: null, enlace });
    const sinDecidir = d.hallazgos.filter((h) => h.auditoriaId === a.id && h.decision.valor === "pendiente").length;
    if (sinDecidir && !soloLectura(a)) add({ tipo: "Aprobación", titulo: `Decidir ${sinDecidir} hallazgo(s) de ${a.ref}`, detalle: "Priorizar, investigar o descartar", clientId: a.clientId, especialidad: "Estrategia y planificación", estado: "Aprobación pendiente", vence: null, enlace: `${enlace}?tab=hallazgos` });
  }

  for (const alta of d.altas.filter((x) => x.estado === "Borrador" && (!x.clientId || clientes.has(x.clientId)))) {
    if (puedeActivar(alta)) add({ tipo: "Aprobación", titulo: `Activar el onboarding ${alta.id}`, detalle: alta.datos.nombre ?? "Sin nombre", clientId: alta.clientId ?? "", especialidad: "Onboarding y accesos", estado: "Aprobación pendiente", vence: null, enlace: `${rutaAlta(alta.id)}?paso=H` });
  }

  for (const e of d.encargos.filter((x) => clientes.has(x.clientId))) {
    const alta = d.altas.find((x) => x.id === e.altaId);
    const ficha = `/app/seo/clientes/${e.clientId}?tab=diagnostico`;
    if (e.estado === "En revisión") add({ tipo: "Aprobación", titulo: `Revisión de calidad de ${e.id}`, detalle: "Comprobar alcance, evidencias y limitaciones", clientId: e.clientId, especialidad: "Control de calidad", estado: "Aprobación pendiente", vence: null, enlace: ficha });
    const p = ultimoPlan(e);
    if (p?.estado === "Pendiente de aprobación") add({ tipo: "Aprobación", titulo: `Decidir el plan v${p.version} de ${e.id}`, detalle: `${p.acciones.length} acciones`, clientId: e.clientId, especialidad: "Estrategia y planificación", estado: "Aprobación pendiente", vence: null, enlace: `/app/seo/plan/${e.id}` });
    if (alta && e.estado !== "Pendiente") {
      for (const b of bloqueos(e, alta)) {
        add({ tipo: "Bloqueo", titulo: `Acceso a ${b.nombre}: ${b.estado.toLowerCase()}`, detalle: `Bloquea: ${b.afectados.join(", ")}`, clientId: e.clientId, especialidad: "Onboarding y accesos", estado: "Bloqueo", vence: null, enlace: `/app/seo/clientes/${e.clientId}?tab=accesos` });
      }
    }
  }

  for (const inf of d.informes.filter((x) => clientes.has(x.clientId))) {
    const est = estadoInforme(d, inf);
    if (est === "En revisión") add({ tipo: "Aprobación", titulo: `Aprobar el contenido de ${inf.id}`, detalle: inf.titulo, clientId: inf.clientId, especialidad: "Analítica e informes", estado: "Aprobación pendiente", vence: inf.fechaEntrega, enlace: rutaInforme(inf.id) });
    if (est === "Contenido aprobado") add({ tipo: "Aprobación", titulo: `Autorizar el envío de ${inf.id}`, detalle: inf.titulo, clientId: inf.clientId, especialidad: "Analítica e informes", estado: "Aprobación pendiente", vence: inf.fechaEntrega, enlace: rutaInforme(inf.id) });
    if (est === "Datos insuficientes") add({ tipo: "Bloqueo", titulo: `${inf.id} sin datos suficientes`, detalle: inf.titulo, clientId: inf.clientId, especialidad: "Analítica e informes", estado: "Datos insuficientes", vence: inf.fechaEntrega, enlace: rutaInforme(inf.id) });
  }

  const auditoriasVisibles = new Map(d.auditorias.filter((a) => clientes.has(a.clientId)).map((a) => [a.id, a]));
  for (const t of d.tareas.filter((x) => auditoriasVisibles.has(x.auditoriaId) && vencida(x))) {
    const a = auditoriasVisibles.get(t.auditoriaId)!;
    add({ tipo: "Riesgo", titulo: `Tarea vencida: ${t.titulo}`, detalle: `Vencía el ${t.fecha}`, clientId: a.clientId, especialidad: especialidadDeAgente(t.agenteId) ?? "Estrategia y planificación", estado: "Riesgo", vence: t.fecha, enlace: `/app/seo/auditorias/${a.id}?tab=hallazgos#h-${t.hallazgoId}` });
  }

  const porProyecto = new Map<string, typeof d.mediciones>();
  for (const m of d.mediciones.filter((x) => clientes.has(x.clientId) && x.estado === "medida")) {
    porProyecto.set(m.proyectoId, [...(porProyecto.get(m.proyectoId) ?? []), m]);
  }
  for (const [, ms] of porProyecto) {
    const orden = [...ms].sort((a, b) => a.en.localeCompare(b.en));
    const [prev, ult] = [orden.at(-2), orden.at(-1)];
    if (prev && ult && ult.menciones < prev.menciones) {
      add({ tipo: "Riesgo", titulo: "Caída de visibilidad en asistentes", detalle: `${prev.menciones} → ${ult.menciones} respuestas con cita`, clientId: ult.clientId, especialidad: "AEO/GEO y citabilidad", estado: "Riesgo", vence: null, enlace: "/app/seo/geo" });
    }
  }
  const orden: Record<TipoSupervision, number> = { Bloqueo: 0, Aprobación: 1, Riesgo: 2 };
  return out.sort((a, b) => orden[a.tipo] - orden[b.tipo]);
}

// --- Registro -------------------------------------------------------------------

export type Entrada = {
  id: string;
  en: string;
  por: string;
  clientId: string | null;
  especialidad: Especialidad | null;
  estado: string;
  texto: string;
  enlace: string | null;
};

/** Todo lo que ha pasado en el módulo: actividad de la operación más eventos de auditorías. */
export function registro(d: Datos, clientes: Set<string>): Entrada[] {
  const auditorias = new Map(d.auditorias.filter((a) => clientes.has(a.clientId)).map((a) => [a.id, a]));
  const deAuditorias: Entrada[] = d.eventos
    .filter((e) => auditorias.has(e.auditoriaId))
    .map((e) => {
      const a = auditorias.get(e.auditoriaId)!;
      const estado = /bloquead/i.test(e.texto) ? "Bloqueo" : /→ (Autorizado|Validado)|Decisión|completad|cargada|creada/i.test(e.texto) ? "Acción completada" : /pendiente|calidad/i.test(e.texto) ? "Aprobación pendiente" : "Funcionamiento normal";
      return { id: e.id, en: e.en, por: e.por, clientId: a.clientId, especialidad: "Auditoría SEO" as Especialidad, estado, texto: `${a.ref}: ${e.texto}`, enlace: `/app/seo/auditorias/${a.id}?tab=historial` };
    });
  const propios: Entrada[] = d.actividad.filter((x) => !x.clientId || clientes.has(x.clientId));
  return [...deAuditorias, ...propios].sort((a, b) => b.en.localeCompare(a.en));
}

/** Entradas de los últimos `dias` días. */
export const recientes = (entradas: Entrada[], dias = 7) =>
  entradas.filter((x) => Date.parse(x.en) > Date.now() - dias * 864e5);

// --- Agentes ------------------------------------------------------------------

/** Cuántos elementos abiertos puede llevar una especialidad antes de considerarse al límite. */
export const CAPACIDAD_AGENTE = 10;

export type CargaAgente = {
  especialidad: Especialidad;
  n: number;
  clientes: string[];
  abiertos: number;
  carga: number;
  hechas7d: number;
  incidencias7d: number;
};

export function cargaAgentes(d: Datos, clientes: Set<string>): CargaAgente[] {
  const hace7 = Date.now() - 7 * 864e5;
  const auditorias = new Set(d.auditorias.filter((a) => clientes.has(a.clientId)).map((a) => a.id));
  return ESPECIALIDADES.map((esp, i) => {
    const altas = d.altas.filter((a) => a.estado === "Activo" && a.clientId && clientes.has(a.clientId) && a.equipo.includes(esp));
    const tareas = d.tareas.filter((t) => auditorias.has(t.auditoriaId) && especialidadDeAgente(t.agenteId) === esp);
    const abiertasTareas = tareas.filter((t) => t.estado === "pendiente" || t.estado === "en_curso").length;
    const accionesPlan = d.encargos
      .filter((e) => clientes.has(e.clientId))
      .flatMap((e) => (ultimoPlan(e)?.estado === "Listo para ejecución" ? ultimoPlan(e)!.acciones : []))
      .filter((x) => x.agente === esp).length;
    const encargos = d.encargos.filter((e) => clientes.has(e.clientId) && e.agentes.includes(esp) && (e.estado === "En curso" || e.estado === "Bloqueado")).length;
    const abiertos = abiertasTareas + accionesPlan + encargos;
    return {
      especialidad: esp,
      n: i + 1,
      clientes: [...new Set(altas.map((a) => a.clientId as string))],
      abiertos,
      carga: Math.min(100, Math.round((abiertos / CAPACIDAD_AGENTE) * 100)),
      hechas7d: tareas.filter((t) => t.estado === "hecha" && t.cerradaEn && Date.parse(t.cerradaEn) > hace7).length,
      incidencias7d: d.actividad.filter((x) => x.especialidad === esp && ["Error", "Bloqueo", "Datos insuficientes"].includes(x.estado) && Date.parse(x.en) > hace7).length,
    };
  });
}

// --- Ciclo e indicadores --------------------------------------------------------

export function ciclo(d: Datos, clientes: Set<string>) {
  const ids = (xs: string[]) => new Set(xs).size;
  const encargos = d.encargos.filter((e) => clientes.has(e.clientId));
  const auditorias = d.auditorias.filter((a) => clientes.has(a.clientId) && !a.archivadaEn);
  return {
    planificacion: ids(encargos.filter((e) => e.estado !== "Completado" || ultimoPlan(e)?.estado !== "Listo para ejecución").map((e) => e.clientId)),
    ejecucion: ids([
      ...encargos.filter((e) => ultimoPlan(e)?.estado === "Listo para ejecución").map((e) => e.clientId),
      ...auditorias.filter((a) => ["en_cola", "en_ejecucion"].includes(a.estado)).map((a) => a.clientId),
    ]),
    validacion: ids([
      ...auditorias.filter((a) => a.estado === "control_calidad").map((a) => a.clientId),
      ...encargos.filter((e) => e.estado === "En revisión").map((e) => e.clientId),
      ...d.informes.filter((i) => clientes.has(i.clientId) && !i.envioAutorizado).map((i) => i.clientId),
    ]),
  };
}

export function indicadores(d: Datos, clientes: Set<string>) {
  const hace7 = Date.now() - 7 * 864e5;
  const auditorias = new Set(d.auditorias.filter((a) => clientes.has(a.clientId)).map((a) => a.id));
  const actividad7 = d.actividad.filter((x) => (!x.clientId || clientes.has(x.clientId)) && Date.parse(x.en) > hace7);
  const conFecha = d.tareas.filter((t) => auditorias.has(t.auditoriaId) && t.estado === "hecha" && t.fecha && t.cerradaEn);
  const aTiempo = conFecha.filter((t) => (t.cerradaEn as string).slice(0, 10) <= (t.fecha as string)).length;
  const revisados = d.encargos.filter((e) => clientes.has(e.clientId) && e.revisiones.length);
  const primera = revisados.filter((e) => e.revisiones[0]?.resultado === "Validado").length;
  const medidas = new Map<string, (typeof d.mediciones)[number]>();
  for (const m of [...d.mediciones].filter((x) => clientes.has(x.clientId) && x.estado === "medida").sort((a, b) => a.en.localeCompare(b.en))) {
    medidas.set(m.proyectoId, m);
  }
  const ultimas = [...medidas.values()];
  return {
    accionesCompletadas7d: actividad7.filter((x) => x.estado === "Acción completada").length,
    entregasATiempo: { hechas: aTiempo, total: conFecha.length },
    calidadALaPrimera: { validadas: primera, total: revisados.length },
    citas: { menciones: ultimas.reduce((s, m) => s + m.menciones, 0), consultas: ultimas.reduce((s, m) => s + m.consultas.length, 0), proyectos: ultimas.length },
  };
}
