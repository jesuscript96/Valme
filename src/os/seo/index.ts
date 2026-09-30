import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { requireMember } from "@/os/auth/dal";
import { MEMBERS } from "@/os/data/members";
import { listVisibleClients, memberHasAccess } from "@/os/repo";
import { calcularCobertura } from "./cobertura";
import { leer } from "./store";
import type { Actor, Datos, Tarea } from "./tipos";

/**
 * LECTURAS DEL MÓDULO SEO · GEO · AEO.
 *
 * El módulo trabaja sobre todos los clientes que la persona puede ver, con un filtro de
 * cliente opcional que se guarda en una cookie (los layouts no reciben los parámetros de
 * la URL, y el filtro tiene que valer en todas las pantallas del módulo).
 */

export const COOKIE_CLIENTE = "valme_seo_cliente";

export type Persona = { id: string; nombre: string };

export const seoModulo = cache(async () => {
  const { member } = await requireMember();
  const clientes = await listVisibleClients();
  const elegido = (await cookies()).get(COOKIE_CLIENTE)?.value ?? null;
  const filtro = clientes.find((c) => c.slug === elegido) ?? null;
  const d = leer();

  const accesibles = new Set(clientes.map((c) => c.id));
  const enFiltro = new Set((filtro ? [filtro] : clientes).map((c) => c.id));
  const auditorias = d.auditorias.filter((a) => enFiltro.has(a.clientId));
  const ids = new Set(auditorias.map((a) => a.id));

  const actor: Actor = { id: member.id, nombre: member.name, pm: member.role !== "operator" };

  /** PM (admin o estratega) con acceso a ese cliente: los posibles responsables de tareas. */
  const pmsDe = (clientId: string): Persona[] => {
    const c = clientes.find((x) => x.id === clientId);
    if (!c) return [];
    return MEMBERS.filter((m) => m.role !== "operator" && memberHasAccess(m, c.slug)).map((m) => ({
      id: m.id,
      nombre: m.name,
    }));
  };

  return {
    member,
    actor,
    clientes,
    filtro,
    cliente: (clientId: string) => clientes.find((c) => c.id === clientId) ?? null,
    pmsDe,
    proyectos: d.proyectos.filter((p) => enFiltro.has(p.clientId)),
    auditorias,
    hallazgos: d.hallazgos.filter((h) => ids.has(h.auditoriaId)),
    tareas: d.tareas.filter((t) => ids.has(t.auditoriaId)),
    mediciones: d.mediciones.filter((m) => enFiltro.has(m.clientId)),
    /** El detalle se abre aunque el filtro sea otro cliente: basta con tener acceso. */
    detalle: (auditoriaId: string) => detalle(d, accesibles, auditoriaId),
  };
});

function detalle(d: Datos, accesibles: Set<string>, auditoriaId: string) {
  const a = d.auditorias.find((x) => x.id === auditoriaId && accesibles.has(x.clientId));
  if (!a) return null;
  const hallazgos = d.hallazgos.filter((h) => h.auditoriaId === a.id);
  const evidencias = d.evidencias.filter((e) => e.auditoriaId === a.id);
  const declaraciones = d.declaraciones.filter((x) => x.auditoriaId === a.id);
  return {
    auditoria: a,
    proyecto: d.proyectos.find((p) => p.id === a.proyectoId) ?? null,
    hallazgos,
    evidencias,
    tareas: d.tareas.filter((t) => t.auditoriaId === a.id),
    eventos: d.eventos.filter((e) => e.auditoriaId === a.id).sort((x, y) => y.en.localeCompare(x.en)),
    cobertura: calcularCobertura(a, hallazgos, evidencias, declaraciones),
  };
}

/** H-01, H-02… por orden de alta; estable aunque cambien las decisiones. */
export function referencias<T extends { id: string }>(items: T[], prefijo: string) {
  return new Map(items.map((x, i) => [x.id, `${prefijo}-${String(i + 1).padStart(2, "0")}`]));
}

export const abierta = (t: Tarea) => t.estado === "pendiente" || t.estado === "en_curso";
export const vencida = (t: Tarea) =>
  abierta(t) && Boolean(t.fecha) && (t.fecha as string) < new Date().toISOString().slice(0, 10);

export const rutaAuditoria = (auditoriaId: string) => `/app/seo/auditorias/${auditoriaId}`;
