/**
 * DIAGNÓSTICO · el lado de antes de firmar.
 *
 * Dos entidades y nada más. Sin etapas, sin oportunidades, sin actividad: eso se añade
 * el día que haga falta, y ese día se sabrá qué forma darle porque habrá leads dentro.
 *
 * Aquí los datos son de Valme, no de un cliente. Por eso no hay `clientId` en ninguna
 * parte y la guardia de permisos es distinta a la del lado Cuentas.
 */

import type { Herramienta } from "@/os/audit/tools";
import type { Hallazgo } from "@/os/audit/types";

export type EstadoLead = "nuevo" | "auditado" | "contactado" | "ganado" | "perdido";

export type Lead = {
  id: string;
  empresa: string;
  dominio: string;
  contacto: string | null;
  email: string | null;
  telefono: string | null;
  mensaje: string | null;
  origen: string;
  estado: EstadoLead;
  /** Cuando se gana, el slug del cliente que se creó. El lead no se borra. */
  clienteSlug: string | null;
  recibidoEn: string;
};

export type EjecucionAuditoria = {
  id: string;
  leadId: string | null;
  dominio: string;
  herramienta: Herramienta["clave"];
  ejecutadaEn: string;
  duracionMs: number;
  señales: number;
  /** Recuento por gravedad, para la tabla. */
  resumen: { p0: number; p1: number; p2: number; p3: number; positivos: number };
  /** El informe entero. Lo que se lleva a la reunión. */
  hallazgos: Hallazgo[];
  /** Lo que no se pudo consultar. Va en la portada del informe. */
  fuentesNoDisponibles: { fuente: string; motivo: string }[];
};

export const ESTADO_LABEL: Record<EstadoLead, string> = {
  nuevo: "Nuevo",
  auditado: "Auditado",
  contactado: "Contactado",
  ganado: "Ganado",
  perdido: "Perdido",
};
