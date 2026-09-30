"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ErrorSeo, actualizarTarea, archivarAuditoria, cambiarEstado, crearAuditoria, crearProyecto,
  crearTarea, declararCobertura, decidirHallazgo, editarAlcance, importarPiloto,
  registrarEjecucion, registrarSondeo, reservarParaAgente,
} from "./herramientas";
import { seoDe } from "./index";
import { guardar, leer } from "./store";
import type {
  Actor, Datos, Decision, EstadoAuditoria, EstadoTarea, Resultado, TipoTarea,
} from "./tipos";

/**
 * ESCRITURAS DEL MÓDULO SEO.
 *
 * Cada acción resuelve el cliente con `seoDe()` (sesión + acceso), llama a una
 * herramienta y guarda. Un Server Action es un endpoint público: la autorización está
 * aquí y en la herramienta, no en que el botón se vea o no.
 */

type Ctx = Awaited<ReturnType<typeof seoDe>>;

async function ejecutar(
  slug: string,
  fn: (d: Datos, actor: Actor, ctx: Ctx) => void,
): Promise<Resultado> {
  const ctx = await seoDe(slug);
  try {
    fn(leer(), ctx.actor, ctx);
  } catch (e) {
    if (e instanceof ErrorSeo) return { ok: false, error: e.message };
    throw e;
  }
  guardar();
  revalidatePath(`/app/c/${slug}/seo`, "layout");
  return { ok: true };
}

const texto = (f: FormData, k: string) => String(f.get(k) ?? "");
const numero = (f: FormData, k: string) => Number(f.get(k) ?? NaN);

/** Comprueba que el id pertenece a este cliente antes de tocar nada. */
function delCliente(ctx: Ctx, auditoriaId: string) {
  if (!ctx.auditorias.some((a) => a.id === auditoriaId)) {
    throw new ErrorSeo("La auditoría no existe o no es de este cliente.");
  }
}

// --- Proyectos y auditorías ------------------------------------------------

export async function crearProyectoAccion(slug: string, f: FormData): Promise<Resultado> {
  return ejecutar(slug, (d, actor, ctx) => {
    crearProyecto(d, actor, ctx.scope.client.id, { nombre: texto(f, "nombre"), dominio: texto(f, "dominio") });
  });
}

export async function crearAuditoriaAccion(slug: string, f: FormData): Promise<Resultado> {
  let nueva = "";
  const r = await ejecutar(slug, (d, actor, ctx) => {
    nueva = crearAuditoria(d, actor, ctx.scope.client.id, {
      proyectoId: texto(f, "proyectoId"),
      servicios: f.getAll("servicios").map(String),
      alcance: texto(f, "alcance"),
      paginas: numero(f, "paginas"),
      minutos: numero(f, "minutos"),
      costeEur: numero(f, "coste"),
    }).id;
  });
  if (r.ok) redirect(`/app/c/${slug}/seo/${nueva}`);
  return r;
}

export async function editarAlcanceAccion(slug: string, auditoriaId: string, f: FormData): Promise<Resultado> {
  return ejecutar(slug, (d, actor, ctx) => {
    delCliente(ctx, auditoriaId);
    editarAlcance(d, actor, auditoriaId, {
      servicios: f.getAll("servicios").map(String),
      alcance: texto(f, "alcance"),
      paginas: numero(f, "paginas"),
      minutos: numero(f, "minutos"),
      costeEur: numero(f, "coste"),
    });
  });
}

export async function cambiarEstadoAccion(
  slug: string, auditoriaId: string, destino: EstadoAuditoria, f: FormData,
): Promise<Resultado> {
  return ejecutar(slug, (d, actor, ctx) => {
    delCliente(ctx, auditoriaId);
    cambiarEstado(d, actor, auditoriaId, {
      a: destino, motivo: texto(f, "motivo"), referencia: texto(f, "referencia"),
    });
  });
}

export async function archivarAccion(slug: string, auditoriaId: string, archivar: boolean): Promise<Resultado> {
  return ejecutar(slug, (d, actor, ctx) => {
    delCliente(ctx, auditoriaId);
    archivarAuditoria(d, actor, auditoriaId, archivar);
  });
}

export async function importarPilotoAccion(slug: string, auditoriaId: string): Promise<Resultado> {
  return ejecutar(slug, (d, actor, ctx) => {
    delCliente(ctx, auditoriaId);
    importarPiloto(d, actor, auditoriaId);
  });
}

/** Lanza el motor de auditoría de Valme sobre el dominio y guarda lo que encuentra. */
export async function ejecutarMotorAccion(slug: string, auditoriaId: string): Promise<Resultado> {
  const ctx = await seoDe(slug);
  const a = ctx.auditorias.find((x) => x.id === auditoriaId);
  if (!a) return { ok: false, error: "La auditoría no existe o no es de este cliente." };
  if (a.estado !== "en_ejecucion" || a.archivadaEn) {
    return { ok: false, error: "Solo se ejecuta una auditoría en ejecución." };
  }
  const { auditar } = await import("@/os/audit/run");
  const resultado = await auditar(a.dominio, ["seo"]);
  return ejecutar(slug, (d, actor) => {
    registrarEjecucion(d, actor, auditoriaId, resultado);
  });
}

// --- Cobertura -------------------------------------------------------------

export async function coberturaAccion(slug: string, auditoriaId: string, f: FormData): Promise<Resultado> {
  return ejecutar(slug, (d, actor, ctx) => {
    delCliente(ctx, auditoriaId);
    declararCobertura(d, actor, auditoriaId, {
      servicio: texto(f, "servicio"),
      estado: texto(f, "estado") === "ausencia_declarada" ? "ausencia_declarada" : "pendiente_justificado",
      motivo: texto(f, "motivo"),
    });
  });
}

// --- Hallazgos y tareas ----------------------------------------------------

export async function decidirAccion(slug: string, hallazgoId: string, f: FormData): Promise<Resultado> {
  return ejecutar(slug, (d, actor, ctx) => {
    decidirHallazgo(
      d, actor, hallazgoId,
      { decision: texto(f, "decision") as Decision, nota: texto(f, "nota") },
      ctx.scope.client.id,
    );
  });
}

export async function crearTareaAccion(
  slug: string, hallazgoId: string, tipo: TipoTarea, f: FormData,
): Promise<Resultado> {
  return ejecutar(slug, (d, actor, ctx) => {
    crearTarea(
      d, actor, hallazgoId,
      {
        tipo,
        titulo: texto(f, "titulo"),
        detalle: texto(f, "detalle"),
        criterio: texto(f, "criterio"),
        responsableId: texto(f, "responsableId"),
        agenteId: texto(f, "agenteId"),
        fecha: texto(f, "fecha"),
      },
      ctx.pms.map((p) => p.id),
      ctx.scope.client.id,
    );
  });
}

export async function moverTareaAccion(slug: string, tareaId: string, estado: EstadoTarea): Promise<Resultado> {
  return ejecutar(slug, (d, actor, ctx) => {
    actualizarTarea(d, actor, tareaId, { estado }, ctx.scope.client.id);
  });
}

export async function cerrarTareaAccion(slug: string, tareaId: string, f: FormData): Promise<Resultado> {
  return ejecutar(slug, (d, actor, ctx) => {
    const resultado = texto(f, "resultado");
    actualizarTarea(
      d, actor, tareaId,
      {
        estado: "hecha",
        conclusion: texto(f, "conclusion"),
        resultado: resultado === "priorizar" || resultado === "descartar" ? resultado : "",
      },
      ctx.scope.client.id,
    );
  });
}

/** Agente HTTP: reserva la tarea, hace una petición a la portada y enlaza la evidencia. */
export async function agenteAccion(slug: string, tareaId: string): Promise<Resultado> {
  let url = "";
  const reserva = await ejecutar(slug, (d, actor, ctx) => {
    url = reservarParaAgente(d, actor, tareaId, ctx.scope.client.id).url;
  });
  if (!reserva.ok) return reserva;
  const { sondearPortada } = await import("./sonda");
  const sondeo = await sondearPortada(url).then(
    (r) => ({ ok: true as const, ...r }),
    () => ({ ok: false as const }),
  );
  await ejecutar(slug, (d, actor) => registrarSondeo(d, actor, tareaId, sondeo));
  return sondeo.ok ? { ok: true } : { ok: false, error: "La prueba no se completó. Revisa la tarea." };
}
