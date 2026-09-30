import "server-only";
import { requireMember } from "@/os/auth/dal";
import { MEMBERS } from "@/os/data/members";
import { forClient, memberHasAccess } from "@/os/repo";
import * as seed from "@/os/repo/seed.data";
import { ErrorSeo } from "./herramientas";
import { inyectarCliente } from "./store";
import type { Actor, Datos } from "./tipos";

/**
 * ÁMBITO DE LAS ESCRITURAS del módulo: de qué cliente es un registro y si quien actúa
 * tiene acceso a él. Lo usan todas las server actions del módulo.
 */

export type Ctx = { clientId: string; actor: Actor; pms: string[] };

export async function contexto(clientId: string | null | undefined): Promise<Ctx> {
  const client = seed.clients.find((c) => c.id === clientId);
  if (!client) throw new ErrorSeo("El registro no existe.");
  const scope = await forClient(client.slug);
  return {
    clientId: client.id,
    actor: { id: scope.member.id, nombre: scope.member.name, pm: scope.role !== "operator" },
    pms: MEMBERS.filter((m) => m.role !== "operator" && memberHasAccess(m, client.slug)).map((m) => m.id),
  };
}

/** Quien actúa, sin cliente todavía (un alta de una empresa que aún no es cliente). */
export async function actorSesion(): Promise<Actor> {
  const { member } = await requireMember();
  return { id: member.id, nombre: member.name, pm: member.role !== "operator" };
}

/**
 * Da de alta en Valme a una empresa nueva cuando se activa su onboarding SEO: cliente,
 * Brand Kit en borrador (lo exige el módulo de Cuentas) y proyecto con su dominio.
 */
export function crearClienteValme(d: Datos, x: { nombre: string; dominio: string }): string {
  const base = x.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cliente";
  let slug = base;
  for (let i = 2; seed.clients.some((c) => c.slug === slug); i++) slug = `${base}-${i}`;
  const id = `c_${slug.replace(/-/g, "_")}`;
  const dominio = x.dominio.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const ahora = new Date().toISOString();
  const nuevo = { id, slug, name: x.nombre, websiteUrl: dominio ? `https://${dominio}` : null, createdAt: ahora };
  d.clientesNuevos.push(nuevo);
  inyectarCliente(nuevo);
  if (dominio && !d.proyectos.some((p) => p.clientId === id && p.dominio === dominio)) {
    d.proyectos.push({ id: `pr_${slug}`, clientId: id, nombre: "Web principal", dominio, creadoEn: ahora });
  }
  return id;
}
