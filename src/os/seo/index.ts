import "server-only";
import { cache } from "react";
import { MEMBERS } from "@/os/data/members";
import { forClient, memberHasAccess } from "@/os/repo";
import { calcularCobertura } from "./cobertura";
import { leer } from "./store";
import type { Actor, Auditoria, Datos, Tarea } from "./tipos";

/**
 * LECTURAS DEL MÓDULO SEO, siempre con ámbito de cliente: pasan por `forClient()`,
 * que valida la sesión y el acceso, igual que el resto del área.
 */

export type Persona = { id: string; nombre: string };

export const seoDe = cache(async (slug: string) => {
  const scope = await forClient(slug);
  const d = leer();
  const clientId = scope.client.id;
  const auditorias = d.auditorias.filter((a) => a.clientId === clientId);
  const ids = new Set(auditorias.map((a) => a.id));
  const actor: Actor = {
    id: scope.member.id,
    nombre: scope.member.name,
    pm: scope.role !== "operator",
  };
  // Responsables posibles de una tarea: PM (admin o estratega) con acceso a este cliente.
  const pms: Persona[] = MEMBERS.filter(
    (m) => m.role !== "operator" && memberHasAccess(m, slug),
  ).map((m) => ({ id: m.id, nombre: m.name }));

  return {
    scope,
    actor,
    pms,
    proyectos: d.proyectos.filter((p) => p.clientId === clientId),
    auditorias,
    hallazgos: d.hallazgos.filter((h) => ids.has(h.auditoriaId)),
    tareas: d.tareas.filter((t) => ids.has(t.auditoriaId)),
    detalle: (auditoriaId: string) => detalle(d, auditorias, auditoriaId),
  };
});

function detalle(d: Datos, visibles: Auditoria[], auditoriaId: string) {
  const a = visibles.find((x) => x.id === auditoriaId);
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
export function referencias<T extends { id: string; creadoEn?: string }>(items: T[], prefijo: string) {
  return new Map(items.map((x, i) => [x.id, `${prefijo}-${String(i + 1).padStart(2, "0")}`]));
}

export const abierta = (t: Tarea) => t.estado === "pendiente" || t.estado === "en_curso";
export const vencida = (t: Tarea) =>
  abierta(t) && Boolean(t.fecha) && (t.fecha as string) < new Date().toISOString().slice(0, 10);
