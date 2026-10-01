"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contexto, type Ctx } from "./ambito";
import {
  ErrorSeo, actualizarTarea, archivarAuditoria, cambiarEstado, crearAuditoria, crearProyecto,
  crearTarea, declararCobertura, decidirHallazgo, editarAlcance, importarPiloto,
  registrarEjecucion, registrarMedicionGeo, registrarSondeo, reservarParaAgente,
} from "./herramientas";
import { rutaAuditoria } from "./index";
import { guardar, leer } from "./store";
import type { Datos, Decision, EstadoAuditoria, EstadoTarea, Resultado, TipoTarea } from "./tipos";

/**
 * ESCRITURAS DEL MÓDULO SEO · GEO · AEO.
 *
 * Las acciones reciben ids, no clientes: el cliente se deduce del propio registro y se
 * valida con `forClient()` (sesión + acceso), igual que en el resto del área. Un Server
 * Action es un endpoint público: la autorización está aquí y en la herramienta, no en
 * que el botón se vea o no.
 */

const clienteDe = {
  auditoria: (d: Datos, id: string) => d.auditorias.find((a) => a.id === id)?.clientId,
  proyecto: (d: Datos, id: string) => d.proyectos.find((p) => p.id === id)?.clientId,
  hallazgo: (d: Datos, id: string) =>
    clienteDe.auditoria(d, d.hallazgos.find((h) => h.id === id)?.auditoriaId ?? ""),
  tarea: (d: Datos, id: string) =>
    clienteDe.auditoria(d, d.tareas.find((t) => t.id === id)?.auditoriaId ?? ""),
};

async function ejecutar(
  clientId: string | undefined,
  fn: (d: Datos, ctx: Ctx) => void,
): Promise<Resultado> {
  try {
    const ctx = await contexto(clientId);
    fn(leer(), ctx);
  } catch (e) {
    if (e instanceof ErrorSeo) return { ok: false, error: e.message };
    throw e;
  }
  guardar();
  revalidatePath("/app/seo", "layout");
  return { ok: true };
}

const texto = (f: FormData, k: string) => String(f.get(k) ?? "");
const numero = (f: FormData, k: string) => Number(f.get(k) ?? NaN);

// --- Proyectos y auditorías ------------------------------------------------

export async function crearProyectoAccion(f: FormData): Promise<Resultado> {
  const clientId = texto(f, "clientId");
  return ejecutar(clientId, (d, ctx) => {
    crearProyecto(d, ctx.actor, ctx.clientId, { nombre: texto(f, "nombre"), dominio: texto(f, "dominio") });
  });
}

export async function crearAuditoriaAccion(f: FormData): Promise<Resultado> {
  const proyectoId = texto(f, "proyectoId");
  let nueva = "";
  const r = await ejecutar(clienteDe.proyecto(leer(), proyectoId), (d, ctx) => {
    nueva = crearAuditoria(d, ctx.actor, ctx.clientId, {
      proyectoId,
      servicios: f.getAll("servicios").map(String),
      alcance: texto(f, "alcance"),
      paginas: numero(f, "paginas"),
      minutos: numero(f, "minutos"),
      costeEur: numero(f, "coste"),
    }).id;
  });
  if (r.ok) redirect(rutaAuditoria(nueva));
  return r;
}

export async function editarAlcanceAccion(auditoriaId: string, f: FormData): Promise<Resultado> {
  return ejecutar(clienteDe.auditoria(leer(), auditoriaId), (d, ctx) => {
    editarAlcance(d, ctx.actor, auditoriaId, {
      servicios: f.getAll("servicios").map(String),
      alcance: texto(f, "alcance"),
      paginas: numero(f, "paginas"),
      minutos: numero(f, "minutos"),
      costeEur: numero(f, "coste"),
    });
  });
}

export async function cambiarEstadoAccion(
  auditoriaId: string, destino: EstadoAuditoria, f: FormData,
): Promise<Resultado> {
  return ejecutar(clienteDe.auditoria(leer(), auditoriaId), (d, ctx) => {
    cambiarEstado(d, ctx.actor, auditoriaId, {
      a: destino, motivo: texto(f, "motivo"), referencia: texto(f, "referencia"),
    });
  });
}

export async function archivarAccion(auditoriaId: string, archivar: boolean): Promise<Resultado> {
  return ejecutar(clienteDe.auditoria(leer(), auditoriaId), (d, ctx) => {
    archivarAuditoria(d, ctx.actor, auditoriaId, archivar);
  });
}

export async function importarPilotoAccion(auditoriaId: string): Promise<Resultado> {
  return ejecutar(clienteDe.auditoria(leer(), auditoriaId), (d, ctx) => {
    importarPiloto(d, ctx.actor, auditoriaId);
  });
}

/** Lanza el motor de auditoría de Valme sobre el dominio y guarda lo que encuentra. */
export async function ejecutarMotorAccion(auditoriaId: string): Promise<Resultado> {
  const a = leer().auditorias.find((x) => x.id === auditoriaId);
  try {
    await contexto(a?.clientId);
  } catch (e) {
    if (e instanceof ErrorSeo) return { ok: false, error: e.message };
    throw e;
  }
  if (!a || a.estado !== "en_ejecucion" || a.archivadaEn) {
    return { ok: false, error: "Solo se ejecuta una auditoría en ejecución." };
  }
  const { auditar } = await import("@/os/audit/run");
  // Con el servicio AEO/GEO contratado, además se pregunta a un asistente si cita a la empresa.
  const resultado = await auditar(a.dominio, a.servicios.includes("AEO/GEO") ? ["seo", "geo"] : ["seo"]);
  return ejecutar(a.clientId, (d, ctx) => {
    registrarEjecucion(d, ctx.actor, auditoriaId, resultado);
  });
}

// --- Cobertura -------------------------------------------------------------

export async function coberturaAccion(auditoriaId: string, f: FormData): Promise<Resultado> {
  return ejecutar(clienteDe.auditoria(leer(), auditoriaId), (d, ctx) => {
    declararCobertura(d, ctx.actor, auditoriaId, {
      servicio: texto(f, "servicio"),
      estado: texto(f, "estado") === "ausencia_declarada" ? "ausencia_declarada" : "pendiente_justificado",
      motivo: texto(f, "motivo"),
    });
  });
}

// --- Hallazgos y tareas ----------------------------------------------------

export async function decidirAccion(hallazgoId: string, f: FormData): Promise<Resultado> {
  return ejecutar(clienteDe.hallazgo(leer(), hallazgoId), (d, ctx) => {
    decidirHallazgo(
      d, ctx.actor, hallazgoId,
      { decision: texto(f, "decision") as Decision, nota: texto(f, "nota") },
      ctx.clientId,
    );
  });
}

export async function crearTareaAccion(hallazgoId: string, tipo: TipoTarea, f: FormData): Promise<Resultado> {
  return ejecutar(clienteDe.hallazgo(leer(), hallazgoId), (d, ctx) => {
    crearTarea(
      d, ctx.actor, hallazgoId,
      {
        tipo,
        titulo: texto(f, "titulo"),
        detalle: texto(f, "detalle"),
        criterio: texto(f, "criterio"),
        responsableId: texto(f, "responsableId"),
        agenteId: texto(f, "agenteId"),
        fecha: texto(f, "fecha"),
      },
      ctx.pms,
      ctx.clientId,
    );
  });
}

export async function moverTareaAccion(tareaId: string, estado: EstadoTarea): Promise<Resultado> {
  return ejecutar(clienteDe.tarea(leer(), tareaId), (d, ctx) => {
    actualizarTarea(d, ctx.actor, tareaId, { estado }, ctx.clientId);
  });
}

export async function cerrarTareaAccion(tareaId: string, f: FormData): Promise<Resultado> {
  return ejecutar(clienteDe.tarea(leer(), tareaId), (d, ctx) => {
    const resultado = texto(f, "resultado");
    actualizarTarea(
      d, ctx.actor, tareaId,
      {
        estado: "hecha",
        conclusion: texto(f, "conclusion"),
        resultado: resultado === "priorizar" || resultado === "descartar" ? resultado : "",
      },
      ctx.clientId,
    );
  });
}

/** Agente HTTP: reserva la tarea, hace una petición a la portada y enlaza la evidencia. */
export async function agenteAccion(tareaId: string): Promise<Resultado> {
  const clientId = clienteDe.tarea(leer(), tareaId);
  let url = "";
  const reserva = await ejecutar(clientId, (d, ctx) => {
    url = reservarParaAgente(d, ctx.actor, tareaId, ctx.clientId).url;
  });
  if (!reserva.ok) return reserva;
  const { sondearPortada } = await import("./sonda");
  const sondeo = await sondearPortada(url).then(
    (r) => ({ ok: true as const, ...r }),
    () => ({ ok: false as const }),
  );
  await ejecutar(clientId, (d, ctx) => registrarSondeo(d, ctx.actor, tareaId, sondeo));
  return sondeo.ok ? { ok: true } : { ok: false, error: "La prueba no se completó. Revisa la tarea." };
}

// --- Generadores GEO ----------------------------------------------------------

/** Lee las páginas principales del dominio de un proyecto para prellenar el llms.txt. */
export async function leerPaginasAccion(
  proyectoId: string,
): Promise<{ ok: true; paginas: { titulo: string; url: string; descripcion: string }[] } | { ok: false; error: string }> {
  const p = leer().proyectos.find((x) => x.id === proyectoId);
  try {
    await contexto(p?.clientId);
  } catch (e) {
    if (e instanceof ErrorSeo) return { ok: false, error: e.message };
    throw e;
  }
  if (!p) return { ok: false, error: "El proyecto no existe." };
  const { paginasClave } = await import("@/os/audit/collect/tools/crawl");
  const paginas = await paginasClave(`https://${p.dominio}/`);
  return paginas.length ? { ok: true, paginas } : { ok: false, error: "No se han podido leer páginas del sitio." };
}

// --- Visibilidad en IA (GEO) -----------------------------------------------

/** Mide si los asistentes citan al dominio del proyecto y lo guarda en su histórico. */
export async function medirGeoAccion(proyectoId: string): Promise<Resultado> {
  const p = leer().proyectos.find((x) => x.id === proyectoId);
  try {
    await contexto(p?.clientId);
  } catch (e) {
    if (e instanceof ErrorSeo) return { ok: false, error: e.message };
    throw e;
  }
  if (!p) return { ok: false, error: "El proyecto no existe." };
  const { auditar } = await import("@/os/audit/run");
  const resultado = await auditar(p.dominio, ["geo"]);
  let error: string | null = null;
  const r = await ejecutar(p.clientId, (d, ctx) => {
    const m = registrarMedicionGeo(d, ctx.actor, proyectoId, resultado);
    if (m.estado === "no_disponible") error = m.motivo;
  });
  return r.ok && error ? { ok: false, error } : r;
}
