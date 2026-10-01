import { calcularCobertura } from "../cobertura";
import { ESTADO_LABEL, type Actor, type Datos } from "../tipos";
import { ErrorSeo, exigirPM, limpio, registrar, sello, siguienteRef } from "./comun";
import { completo, disponibles, ultimoPlan } from "./diagnostico";
import { TIPOS_INFORME, type Informe, type TipoInforme } from "./tipos";

/**
 * INFORMES · del resultado a la evidencia.
 *
 * Un informe sale de una auditoría, de un diagnóstico o de las mediciones GEO de un
 * proyecto, y su contenido se construye siempre desde el origen (no se copia a mano).
 * Entregarlo exige dos decisiones separadas: aprobar el contenido y autorizar el envío.
 * Si el origen no tiene datos suficientes, el informe queda bloqueado y lo dice.
 */

export const rutaInforme = (id: string) => `/app/seo/informes/${id}`;

export type Seccion = { titulo: string; lineas: string[] };
export type Contenido = {
  listo: boolean;
  /** Si no está listo, por qué. */
  falta: string | null;
  periodo: string;
  secciones: Seccion[];
};

export function contenido(d: Datos, inf: Informe): Contenido {
  if (inf.tipo === "auditoria") {
    const a = d.auditorias.find((x) => x.id === inf.origenId);
    if (!a) return { listo: false, falta: "La auditoría de origen no existe.", periodo: "—", secciones: [] };
    const hs = d.hallazgos.filter((h) => h.auditoriaId === a.id);
    const ev = d.evidencias.filter((e) => e.auditoriaId === a.id);
    const cob = calcularCobertura(a, hs, ev, d.declaraciones);
    const tareas = d.tareas.filter((t) => t.auditoriaId === a.id);
    return {
      listo: a.estado === "validado",
      falta: a.estado === "validado" ? null : `La auditoría ${a.ref} está «${ESTADO_LABEL[a.estado]}»: solo se entrega una auditoría validada.`,
      periodo: `${a.ref} · ${a.dominio}`,
      secciones: [
        { titulo: "Hallazgos y decisión", lineas: hs.map((h) => `${h.titulo} — prioridad ${h.prioridad}, decisión: ${h.decision.valor}${h.decision.nota ? ` (${h.decision.nota})` : ""}.`) },
        { titulo: "Cobertura por servicio", lineas: cob.map((c) => `${c.servicio}: ${c.estado.replace(/_/g, " ")}${c.motivo ? ` — ${c.motivo}` : ""}.`) },
        { titulo: "Plan de seguimiento", lineas: tareas.map((t) => `${t.titulo} — ${t.estado.replace("_", " ")}${t.fecha ? `, fecha ${t.fecha}` : ""}.`) },
        { titulo: "Evidencias", lineas: [`${ev.length} evidencias registradas, con fuente y fecha, adjuntas a la auditoría.`] },
      ],
    };
  }
  if (inf.tipo === "diagnostico") {
    const e = d.encargos.find((x) => x.id === inf.origenId);
    const a = e && d.altas.find((x) => x.id === e.altaId);
    if (!e || !a) return { listo: false, falta: "El diagnóstico de origen no existe.", periodo: "—", secciones: [] };
    const p = ultimoPlan(e);
    const disp = disponibles(e, a).filter(completo);
    const listo = e.estado === "Completado";
    return {
      listo,
      falta: listo ? null : `El diagnóstico ${e.id} está «${e.estado}»: se entrega cuando calidad lo valida.`,
      periodo: e.id,
      secciones: [
        { titulo: "Hallazgos con evidencia", lineas: disp.map((h) => `${h.ref} ${h.titulo} — ${h.fuente}, ${h.fecha} (${h.evidencia})${h.impacto ? `. Impacto: ${h.impacto}` : ""}.`) },
        { titulo: "Datos ausentes y limitaciones", lineas: e.hallazgos.filter((h) => !disp.includes(h)).map((h) => `${h.titulo}: sin evidencia${h.dep ? ` (depende de ${h.dep})` : ""}. No se estima.`) },
        { titulo: "Plan de trabajo", lineas: p ? [`v${p.version} · ${p.estado} · ${p.acciones.length} acciones.`, ...p.acciones.map((x) => `${x.n}. ${x.accion} — ${x.entregable}, ${x.agente}, ${x.plazo}.`)] : ["Sin plan generado."] },
      ],
    };
  }
  const medidas = d.mediciones.filter((m) => m.proyectoId === inf.origenId && m.estado === "medida").sort((x, y) => x.en.localeCompare(y.en));
  const p = d.proyectos.find((x) => x.id === inf.origenId);
  return {
    listo: medidas.length > 0,
    falta: medidas.length ? null : "Sin mediciones GEO válidas del proyecto: no hay nada que informar todavía.",
    periodo: medidas.length ? `${sello(medidas[0]!.en)} – ${sello(medidas.at(-1)!.en)}` : "—",
    secciones: [
      { titulo: `Visibilidad de ${p?.dominio ?? "el dominio"} en asistentes`, lineas: medidas.map((m) => `${sello(m.en)}: aparece en ${m.menciones} de ${m.consultas.length} respuestas${m.posicion ? `, mejor puesto #${m.posicion}` : ""}. Categoría: ${m.categoria ?? "—"}.`) },
      { titulo: "A quién recomiendan en su lugar", lineas: [medidas.at(-1)?.competidores.join(", ") || "—"] },
      { titulo: "Limitaciones", lineas: ["Un solo modelo y sin búsqueda web; la respuesta varía entre ejecuciones. Se lee como tendencia, no como nota."] },
    ],
  };
}

export type EstadoInforme = "Envío autorizado" | "Contenido aprobado" | "Datos insuficientes" | "En revisión";

export function estadoInforme(d: Datos, inf: Informe): EstadoInforme {
  if (inf.envioAutorizado) return "Envío autorizado";
  if (inf.contenidoAprobado) return "Contenido aprobado";
  return contenido(d, inf).listo ? "En revisión" : "Datos insuficientes";
}

export function crearInforme(
  d: Datos, actor: Actor, x: { clientId: string; tipo: TipoInforme; origenId: string; fechaEntrega?: string },
): Informe {
  if (!TIPOS_INFORME[x.tipo]) throw new ErrorSeo("Tipo de informe desconocido.");
  const nombreOrigen =
    x.tipo === "auditoria" ? d.auditorias.find((a) => a.id === x.origenId && a.clientId === x.clientId)?.ref
    : x.tipo === "diagnostico" ? d.encargos.find((e) => e.id === x.origenId && e.clientId === x.clientId)?.id
    : d.proyectos.find((p) => p.id === x.origenId && p.clientId === x.clientId)?.dominio;
  if (!nombreOrigen) throw new ErrorSeo("Elige un origen de este cliente.");
  const inf: Informe = {
    id: siguienteRef("REP", d.informes.map((i) => i.id)),
    clientId: x.clientId,
    tipo: x.tipo,
    origenId: x.origenId,
    titulo: `${TIPOS_INFORME[x.tipo]} · ${nombreOrigen}`,
    creadoEn: new Date().toISOString(),
    creadoPor: actor.nombre,
    fechaEntrega: limpio(x.fechaEntrega) || null,
    contenidoAprobado: null,
    envioAutorizado: null,
  };
  d.informes.push(inf);
  registrar(d, { por: actor.nombre, clientId: x.clientId, especialidad: "Analítica e informes", estado: "Aprobación pendiente", texto: `Informe ${inf.id} preparado: ${inf.titulo}.`, enlace: rutaInforme(inf.id) });
  return inf;
}

function informe(d: Datos, id: string): Informe {
  const inf = d.informes.find((x) => x.id === id);
  if (!inf) throw new ErrorSeo("El informe no existe.");
  return inf;
}

export function aprobarContenido(d: Datos, actor: Actor, id: string): void {
  exigirPM(actor, "aprobar el contenido de un informe");
  const inf = informe(d, id);
  if (inf.contenidoAprobado) throw new ErrorSeo("El contenido ya está aprobado.");
  const c = contenido(d, inf);
  if (!c.listo) throw new ErrorSeo(`Datos insuficientes: ${c.falta}`);
  inf.contenidoAprobado = { por: actor.nombre, en: new Date().toISOString() };
  registrar(d, { por: actor.nombre, clientId: inf.clientId, especialidad: "Analítica e informes", texto: `Contenido del informe ${inf.id} aprobado. No se ha enviado.`, enlace: rutaInforme(inf.id) });
}

export function autorizarEnvio(d: Datos, actor: Actor, id: string): void {
  exigirPM(actor, "autorizar el envío de un informe");
  const inf = informe(d, id);
  if (!inf.contenidoAprobado) throw new ErrorSeo("Primero hay que aprobar el contenido: son decisiones separadas.");
  if (inf.envioAutorizado) throw new ErrorSeo("El envío ya está autorizado.");
  inf.envioAutorizado = { por: actor.nombre, en: new Date().toISOString() };
  registrar(d, { por: actor.nombre, clientId: inf.clientId, especialidad: "Analítica e informes", texto: `Envío del informe ${inf.id} autorizado. No se ha enviado ninguna comunicación desde aquí.`, enlace: rutaInforme(inf.id) });
}
