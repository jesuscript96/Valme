"use server";

import { requireMember } from "@/os/auth/dal";
import { auditar } from "@/os/audit/run";
import { CLAVES, type Herramienta } from "@/os/audit/tools";
import type { Auditoria } from "@/os/audit/types";

export type EstadoEjecucion =
  | { fase: "vacio" }
  | { fase: "error"; mensaje: string }
  | { fase: "hecho"; resultado: Auditoria };

/**
 * Ejecuta la auditoría de verdad, en el servidor.
 *
 * Tarda entre veinte y cuarenta segundos: la mayor parte es cargar la página con un
 * navegador y esperar a que se ejecute todo lo que la web inyecta después. Es lento a
 * propósito, porque es lo único que distingue lo que está instalado de lo que solo
 * aparece escrito en el código.
 */
export async function ejecutar(
  _prev: EstadoEjecucion,
  form: FormData,
): Promise<EstadoEjecucion> {
  await requireMember();

  const dominio = String(form.get("dominio") ?? "").trim();
  const tool = String(form.get("tool") ?? "");

  if (!CLAVES.includes(tool as Herramienta["clave"])) {
    return { fase: "error", mensaje: "Herramienta desconocida." };
  }
  if (!/^([\w-]+\.)+[a-z]{2,}$/i.test(dominio.replace(/^https?:\/\//, "").replace(/\/.*$/, ""))) {
    return { fase: "error", mensaje: "Escribe un dominio válido, por ejemplo ejemplo.es" };
  }

  try {
    const resultado = await auditar(dominio, [tool as Herramienta["clave"]]);
    return { fase: "hecho", resultado };
  } catch (e) {
    return { fase: "error", mensaje: e instanceof Error ? e.message : "Fallo desconocido" };
  }
}
