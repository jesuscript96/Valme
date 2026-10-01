import { ErrorSeo } from "../herramientas";
import type { Actor, Datos } from "../tipos";
import type { Actividad, Especialidad, EstadoActividad } from "./tipos";

export { ErrorSeo };

export const ahora = () => new Date().toISOString();
export const nuevoId = (prefijo: string) => `${prefijo}_${crypto.randomUUID().slice(0, 8)}`;
export const limpio = (s: string | undefined | null) => (s ?? "").trim();

/** Fecha legible para los historiales: «30 sep 2026 · 20:14». */
export function sello(iso = ahora()): string {
  const f = new Date(iso);
  const dia = f.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  const hora = f.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${dia} · ${hora}`;
}

/** Siguiente referencia correlativa: ONB-001, DIA-001, REP-001… */
export function siguienteRef(prefijo: string, existentes: string[]): string {
  const n = Math.max(0, ...existentes.filter((x) => x.startsWith(`${prefijo}-`)).map((x) => Number(x.split("-")[1]) || 0)) + 1;
  return `${prefijo}-${String(n).padStart(3, "0")}`;
}

export function exigirPM(actor: Actor, que: string) {
  if (!actor.pm) throw new ErrorSeo(`Solo un PM (admin o estratega) puede ${que}.`);
}

/** Registro de actividad del módulo. Alimenta Operaciones y el Centro de mando. */
export function registrar(
  d: Datos,
  a: {
    por: string;
    clientId: string | null;
    texto: string;
    estado?: EstadoActividad;
    especialidad?: Especialidad | null;
    enlace?: string | null;
  },
): Actividad {
  const x: Actividad = {
    id: nuevoId("act"),
    en: ahora(),
    por: a.por,
    clientId: a.clientId,
    especialidad: a.especialidad ?? null,
    estado: a.estado ?? "Acción completada",
    texto: a.texto,
    enlace: a.enlace ?? null,
  };
  d.actividad.push(x);
  return x;
}
