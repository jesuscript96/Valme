"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as seed from "@/os/repo/seed.data";
import { actorSesion, contexto, crearClienteValme } from "../ambito";
import { ErrorSeo } from "../herramientas";
import { guardar, leer } from "../store";
import type { Actor, Datos, Resultado } from "../tipos";
import {
  actualizarAcceso, declarar, decidirPlan, enviarCalidad, generarPlan, iniciar, nuevaVersion,
  registrarEvidencia, revisarCalidad, rutaPlan,
} from "./diagnostico";
import { aprobarContenido, autorizarEnvio, crearInforme, rutaInforme } from "./informes";
import {
  activarAlta, guardarAlta, nuevaAlta, registrarExcepcion, rutaAlta, type CambiosAlta,
} from "./onboarding";
import {
  ACCIONES_AUTONOMIA, CAMPOS, HERRAMIENTAS_ACCESO, PASOS_ALTA,
  type AccesoId, type EstadoAcceso, type TipoInforme,
} from "./tipos";

/**
 * ESCRITURAS DE LA OPERACIÓN SEO: onboarding, diagnóstico, plan e informes.
 * El cliente de cada registro se valida con `forClient()`; un alta de una empresa que
 * aún no es cliente solo exige sesión (y las decisiones, rol de PM en la herramienta).
 */

async function hacer(
  clientId: string | null | undefined,
  fn: (d: Datos, actor: Actor) => void,
): Promise<Resultado> {
  try {
    const d = leer();
    const actor = clientId ? (await contexto(clientId)).actor : await actorSesion();
    fn(d, actor);
  } catch (e) {
    if (e instanceof ErrorSeo) return { ok: false, error: e.message };
    throw e;
  }
  guardar();
  revalidatePath("/app/seo", "layout");
  return { ok: true };
}

const texto = (f: FormData, k: string) => String(f.get(k) ?? "");
const altaCliente = (id: string) => leer().altas.find((a) => a.id === id)?.clientId;
const encargoCliente = (id: string) => leer().encargos.find((e) => e.id === id)?.clientId;

// --- Onboarding ------------------------------------------------------------

/** Abre un alta: para un cliente de Valme o para una empresa nueva. */
export async function nuevaAltaAccion(f: FormData): Promise<Resultado> {
  const clientId = texto(f, "clientId") || null;
  let id = "";
  const r = await hacer(clientId, (d, actor) => {
    const proyecto = clientId ? d.proyectos.find((p) => p.clientId === clientId) : null;
    const nombre = (clientId && seed.clients.find((c) => c.id === clientId)?.name) || texto(f, "nombre");
    id = nuevaAlta(d, actor, clientId ? { id: clientId, nombre, dominio: proyecto?.dominio ?? null } : undefined, nombre).id;
  });
  if (r.ok) redirect(`${rutaAlta(id)}?paso=A`);
  return r;
}

/** Guarda el paso actual y, según el botón pulsado, avanza, retrocede o sale. */
export async function guardarPasoAccion(altaId: string, paso: string, f: FormData): Promise<Resultado> {
  const c: CambiosAlta = {};
  const datos: Record<string, string> = {};
  for (const campo of CAMPOS) if (f.has(campo.id)) datos[campo.id] = texto(f, campo.id);
  if (Object.keys(datos).length) c.datos = datos;
  if (paso === "B") c.servicios = f.getAll("servicios").map(String);
  if (paso === "E") c.accesos = Object.fromEntries(HERRAMIENTAS_ACCESO.map((h) => [h.id, texto(f, `acceso_${h.id}`)]));
  if (paso === "F") c.autonomia = Object.fromEntries(ACCIONES_AUTONOMIA.map((a) => [a.id, texto(f, `autonomia_${a.id}`)]));
  if (paso === "G") {
    c.equipo = f.getAll("equipo").map(String);
    c.responsableCalidad = texto(f, "responsableCalidad");
  }
  const r = await hacer(altaCliente(altaId), (d, actor) => guardarAlta(d, actor, altaId, c));
  if (!r.ok) return r;
  const ir = texto(f, "ir");
  const i = PASOS_ALTA.findIndex((p) => p.letra === paso);
  const vista = texto(f, "vista") === "cliente" ? "&vista=cliente" : "";
  if (ir === "salir") redirect("/app/seo/onboarding");
  if (ir === "siguiente" && PASOS_ALTA[i + 1]) redirect(`${rutaAlta(altaId)}?paso=${PASOS_ALTA[i + 1]!.letra}${vista}`);
  if (ir === "anterior" && PASOS_ALTA[i - 1]) redirect(`${rutaAlta(altaId)}?paso=${PASOS_ALTA[i - 1]!.letra}${vista}`);
  if (/^[A-H]$/.test(ir)) redirect(`${rutaAlta(altaId)}?paso=${ir}${vista}`);
  return r;
}

export async function excepcionAccion(altaId: string, req: string, f: FormData): Promise<Resultado> {
  return hacer(altaCliente(altaId), (d, actor) => registrarExcepcion(d, actor, altaId, req, texto(f, "motivo")));
}

export async function activarAltaAccion(altaId: string): Promise<Resultado> {
  let clientId = "";
  const r = await hacer(altaCliente(altaId), (d, actor) => {
    clientId = activarAlta(d, actor, altaId, (x) => crearClienteValme(d, x)).clientId;
  });
  if (r.ok) redirect(`/app/seo/clientes/${clientId}?tab=diagnostico`);
  return r;
}

export async function accesoAccion(altaId: string, acceso: AccesoId, f: FormData): Promise<Resultado> {
  return hacer(altaCliente(altaId), (d, actor) => {
    actualizarAcceso(d, actor, altaId, acceso, texto(f, "estado") as EstadoAcceso);
  });
}

// --- Diagnóstico -------------------------------------------------------------

export async function iniciarDiagnosticoAccion(encargoId: string): Promise<Resultado> {
  return hacer(encargoCliente(encargoId), (d, actor) => iniciar(d, actor, encargoId));
}

export async function declararAccion(encargoId: string): Promise<Resultado> {
  return hacer(encargoCliente(encargoId), (d, actor) => declarar(d, actor, encargoId));
}

export async function enviarCalidadAccion(encargoId: string): Promise<Resultado> {
  return hacer(encargoCliente(encargoId), (d, actor) => enviarCalidad(d, actor, encargoId));
}

export async function revisarCalidadAccion(encargoId: string, f: FormData): Promise<Resultado> {
  return hacer(encargoCliente(encargoId), (d, actor) => revisarCalidad(d, actor, encargoId, texto(f, "comentario")));
}

export async function evidenciaAccion(encargoId: string, ref: string, f: FormData): Promise<Resultado> {
  return hacer(encargoCliente(encargoId), (d, actor) =>
    registrarEvidencia(d, actor, encargoId, ref, {
      fuente: texto(f, "fuente"), fecha: texto(f, "fecha"), evidencia: texto(f, "evidencia"),
      impacto: texto(f, "impacto"), limitaciones: texto(f, "limitaciones"),
    }),
  );
}

export async function generarPlanAccion(encargoId: string): Promise<Resultado> {
  const r = await hacer(encargoCliente(encargoId), (d, actor) => {
    generarPlan(d, actor, encargoId);
  });
  if (r.ok) redirect(rutaPlan(encargoId));
  return r;
}

export async function decidirPlanAccion(
  encargoId: string, tipo: "Aprobado" | "Cambios solicitados" | "Rechazado", f: FormData,
): Promise<Resultado> {
  return hacer(encargoCliente(encargoId), (d, actor) => decidirPlan(d, actor, encargoId, tipo, texto(f, "comentario")));
}

export async function nuevaVersionAccion(encargoId: string): Promise<Resultado> {
  return hacer(encargoCliente(encargoId), (d, actor) => {
    nuevaVersion(d, actor, encargoId);
  });
}

// --- Informes ------------------------------------------------------------------

export async function crearInformeAccion(f: FormData): Promise<Resultado> {
  const [tipo, origenId] = texto(f, "origen").split(":") as [TipoInforme, string];
  const d = leer();
  const clientId =
    tipo === "auditoria" ? d.auditorias.find((a) => a.id === origenId)?.clientId
    : tipo === "diagnostico" ? d.encargos.find((e) => e.id === origenId)?.clientId
    : d.proyectos.find((p) => p.id === origenId)?.clientId;
  let id = "";
  const r = await hacer(clientId, (datos, actor) => {
    id = crearInforme(datos, actor, { clientId: clientId as string, tipo, origenId, fechaEntrega: texto(f, "fecha") }).id;
  });
  if (r.ok) redirect(rutaInforme(id));
  return r;
}

const informeCliente = (id: string) => leer().informes.find((i) => i.id === id)?.clientId;

export async function aprobarContenidoAccion(id: string): Promise<Resultado> {
  return hacer(informeCliente(id), (d, actor) => aprobarContenido(d, actor, id));
}

export async function autorizarEnvioAccion(id: string): Promise<Resultado> {
  return hacer(informeCliente(id), (d, actor) => autorizarEnvio(d, actor, id));
}
