import type { Actor, Datos } from "../tipos";
import { crearEncargo } from "./diagnostico";
import { ErrorSeo, exigirPM, limpio, registrar, sello, siguienteRef } from "./comun";
import {
  ACCIONES_AUTONOMIA, CAMPOS, ESPECIALIDADES, ESTADOS_ACCESO, HERRAMIENTAS_ACCESO,
  NIVELES_AUTONOMIA, PASOS_ALTA, SERVICIOS_ALTA,
  type AccesoId, type AccionAutonomiaId, type Alta, type CampoId, type Especialidad,
  type EstadoAcceso, type NivelAutonomia, type ServicioAlta,
} from "./tipos";

/**
 * ALTA DEL CLIENTE · asistente de ocho pasos (A-H).
 *
 * Sin información validada no empieza el trabajo. El asistente recoge empresa, alcance,
 * negocio, contexto, accesos, autonomía y equipo; el PM revisa los requisitos y activa.
 * Activar crea el encargo de diagnóstico: el servicio aún no está en marcha.
 */

export const rutaAlta = (id: string) => `/app/seo/onboarding/${id}`;

const autonomiaInicial = () =>
  Object.fromEntries(
    ACCIONES_AUTONOMIA.map((a) => [a.id, a.sensible ? "Autorización del PM" : "El agente prepara y ejecuta"]),
  ) as Record<AccionAutonomiaId, NivelAutonomia>;

const accesosIniciales = () =>
  Object.fromEntries(HERRAMIENTAS_ACCESO.map((h) => [h.id, "No solicitado"])) as Record<AccesoId, EstadoAcceso>;

export function nuevaAlta(
  d: Datos,
  actor: Actor,
  cliente?: { id: string; nombre: string; dominio: string | null },
  /** Nombre de una empresa nueva, si ya se sabe. */
  nombreNuevo?: string,
): Alta {
  if (cliente && d.altas.some((a) => a.clientId === cliente.id)) {
    throw new ErrorSeo("Este cliente ya tiene un alta de SEO. Ábrela desde la lista.");
  }
  const alta: Alta = {
    id: siguienteRef("ONB", d.altas.map((a) => a.id)),
    estado: "Borrador",
    creadaEn: new Date().toISOString(),
    creadaPor: actor.nombre,
    clientId: cliente?.id ?? null,
    datos: cliente
      ? { nombre: cliente.nombre, dominio: cliente.dominio ?? "", pm: actor.nombre }
      : { nombre: limpio(nombreNuevo), pm: actor.nombre },
    servicios: [],
    accesos: accesosIniciales(),
    autonomia: autonomiaInicial(),
    equipo: [],
    responsableCalidad: "",
    excepciones: [],
    historial: [`${sello()} · Borrador creado por ${actor.nombre}.`],
    activadaEn: null,
  };
  d.altas.push(alta);
  registrar(d, {
    por: actor.nombre, clientId: alta.clientId, especialidad: "Onboarding y accesos",
    estado: "Funcionamiento normal", texto: `Alta ${alta.id} abierta${cliente ? ` para ${cliente.nombre}` : ""}.`,
    enlace: rutaAlta(alta.id),
  });
  return alta;
}

export function alta(d: Datos, id: string): Alta {
  const a = d.altas.find((x) => x.id === id);
  if (!a) throw new ErrorSeo("El alta no existe.");
  return a;
}

export type CambiosAlta = {
  datos?: Partial<Record<CampoId, string>>;
  servicios?: string[];
  accesos?: Partial<Record<string, string>>;
  autonomia?: Partial<Record<string, string>>;
  equipo?: string[];
  responsableCalidad?: string;
};

/** Guarda lo escrito en un paso. Un alta activa solo se consulta (los accesos se cambian desde la ficha). */
export function guardarAlta(d: Datos, actor: Actor, id: string, c: CambiosAlta): void {
  const a = alta(d, id);
  if (a.estado === "Activo") {
    throw new ErrorSeo("Este onboarding ya está activo: los datos se muestran solo para consulta.");
  }
  if (c.datos) {
    for (const campo of CAMPOS) {
      const v = c.datos[campo.id];
      if (v !== undefined) a.datos[campo.id] = limpio(v);
    }
  }
  if (c.servicios) a.servicios = SERVICIOS_ALTA.filter((s) => c.servicios?.includes(s));
  if (c.accesos) {
    for (const h of HERRAMIENTAS_ACCESO) {
      const v = c.accesos[h.id];
      if (v && (ESTADOS_ACCESO as readonly string[]).includes(v)) a.accesos[h.id] = v as EstadoAcceso;
    }
  }
  if (c.autonomia) {
    for (const acc of ACCIONES_AUTONOMIA) {
      const v = c.autonomia[acc.id];
      if (!v || !(NIVELES_AUTONOMIA as readonly string[]).includes(v)) continue;
      // Una acción sensible nunca puede quedar en manos del agente sin decisión humana.
      if (acc.sensible && v === "El agente prepara y ejecuta") {
        throw new ErrorSeo(`«${acc.label}» es una acción sensible: requiere autorización humana.`);
      }
      a.autonomia[acc.id] = v as NivelAutonomia;
    }
  }
  if (c.equipo) a.equipo = ESPECIALIDADES.filter((e) => c.equipo?.includes(e));
  if (c.responsableCalidad !== undefined) a.responsableCalidad = limpio(c.responsableCalidad);
}

export type Pendiente = { id: string; label: string; paso: string };

/** Campos obligatorios vacíos, más equipo y responsable de calidad. */
export function pendientes(a: Alta): Pendiente[] {
  const out: Pendiente[] = CAMPOS.filter((c) => c.req && !limpio(a.datos[c.id])).map((c) => ({
    id: c.id, label: c.label, paso: c.paso,
  }));
  if (!a.servicios.length) out.splice(7, 0, { id: "servicios", label: "Servicios contratados", paso: "B" });
  if (!a.equipo.length) out.push({ id: "equipo", label: "Agentes asignados al alcance", paso: "G" });
  if (!limpio(a.responsableCalidad)) out.push({ id: "calidad", label: "Responsable de calidad", paso: "G" });
  return out;
}

/** 22 campos obligatorios + servicios… en Search OS, 24 comprobaciones en total. */
const TOTAL = CAMPOS.filter((c) => c.req).length + 3;
export const progreso = (a: Alta) => Math.round(((TOTAL - pendientes(a).length) / TOTAL) * 100);

export type Requisito = {
  id: "campos" | "accesos" | "autoridad" | "equipo" | "linea-base";
  label: string;
  ok: boolean;
  detalle: string;
  dispensable: boolean;
};

export function requisitos(a: Alta): Requisito[] {
  const n = pendientes(a).length;
  const solicitados = HERRAMIENTAS_ACCESO.filter((h) => a.accesos[h.id] !== "No solicitado").length;
  const validados = HERRAMIENTAS_ACCESO.filter((h) => a.accesos[h.id] === "Validado").length;
  const sinAutorizacion = ACCIONES_AUTONOMIA.some(
    (x) => x.sensible && a.autonomia[x.id] === "El agente prepara y ejecuta",
  );
  return [
    { id: "campos", label: "Información obligatoria completa", ok: n === 0, detalle: n ? `${n} campos pendientes` : "Sin campos pendientes", dispensable: false },
    { id: "accesos", label: "Al menos un acceso validado", ok: validados >= 1, detalle: `${validados} de ${solicitados} solicitados están validados`, dispensable: true },
    {
      id: "autoridad", label: "Acciones sensibles bajo autorización humana", ok: !sinAutorizacion,
      detalle: sinAutorizacion ? "Alguna acción sensible quedaría sin autorización" : "Publicar, enviar, presupuesto, permisos y borrado requieren autorización",
      dispensable: false,
    },
    { id: "equipo", label: "Equipo asignado según el alcance", ok: a.equipo.length >= 1 && a.equipo.length <= 8, detalle: `${a.equipo.length} especialidades asignadas de 8`, dispensable: false },
    { id: "linea-base", label: "Situación inicial declarada", ok: Boolean(limpio(a.datos.base)), detalle: limpio(a.datos.base) || "Sin declarar", dispensable: true },
  ];
}

/** Todo cumplido, o dispensable con excepción registrada. */
export const puedeActivar = (a: Alta) =>
  requisitos(a).every((r) => r.ok || (r.dispensable && a.excepciones.some((e) => e.req === r.id)));

export function registrarExcepcion(d: Datos, actor: Actor, id: string, req: string, motivo: string): void {
  exigirPM(actor, "registrar excepciones");
  const a = alta(d, id);
  if (a.estado === "Activo") throw new ErrorSeo("El alta ya está activa.");
  const r = requisitos(a).find((x) => x.id === req);
  if (!r) throw new ErrorSeo("Ese requisito no existe.");
  if (!r.dispensable) throw new ErrorSeo("Sin excepción posible: el requisito es indispensable.");
  if (r.ok) throw new ErrorSeo("El requisito ya se cumple.");
  if (a.excepciones.some((e) => e.req === r.id)) throw new ErrorSeo("Ya hay una excepción registrada.");
  const texto = limpio(motivo) || "Requisito dispensable; el PM asume el riesgo y lo revisará en el primer ciclo.";
  a.excepciones.push({ req: r.id as "accesos" | "linea-base", motivo: texto, por: actor.nombre, en: new Date().toISOString() });
  a.historial.push(`${sello()} · Excepción registrada por ${actor.nombre}: ${texto}`);
}

/**
 * Activar: registra la aprobación del PM y crea el encargo de diagnóstico. Si la empresa
 * aún no es cliente de Valme, `crearCliente` la da de alta y devuelve su id.
 */
export function activarAlta(
  d: Datos,
  actor: Actor,
  id: string,
  crearCliente: (datos: { nombre: string; dominio: string }) => string,
): { encargoId: string; clientId: string } {
  exigirPM(actor, "activar un alta");
  const a = alta(d, id);
  if (a.estado === "Activo") throw new ErrorSeo("Este onboarding ya está activo.");
  if (!puedeActivar(a)) {
    throw new ErrorSeo("No se puede activar el servicio mientras falte un requisito indispensable.");
  }
  if (!a.clientId) {
    a.clientId = crearCliente({ nombre: limpio(a.datos.nombre), dominio: limpio(a.datos.dominio) });
  }
  a.estado = "Activo";
  a.activadaEn = new Date().toISOString();
  a.historial.push(`${sello()} · Activación aprobada por ${actor.nombre}.`);
  const enc = crearEncargo(d, a);
  a.historial.push(`${sello()} · Encargo ${enc.id} creado. El servicio no está activo todavía.`);
  registrar(d, {
    por: actor.nombre, clientId: a.clientId, especialidad: "Onboarding y accesos",
    texto: `Onboarding ${a.id} aprobado. Cliente en «Diagnóstico pendiente» con el encargo ${enc.id}.`,
    enlace: `/app/seo/clientes/${a.clientId}?tab=diagnostico`,
  });
  return { encargoId: enc.id, clientId: a.clientId };
}

export const pasoDe = (letra: string) => PASOS_ALTA.find((p) => p.letra === letra) ?? PASOS_ALTA[0];
export type { Especialidad, ServicioAlta };
