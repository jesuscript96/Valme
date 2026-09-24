import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireMember } from "@/os/auth/dal";
import * as seed from "./seed";
import type { EjecucionAuditoria, Lead } from "./types";

/**
 * GUARDIA DE DIAGNÓSTICO.
 *
 * Distinta a `forClient()` del lado Cuentas, y a propósito: aquí los datos son de Valme,
 * no de un cliente. Cualquiera del equipo ve todos los leads.
 *
 * Es la decisión que hay que confirmar antes de que esto crezca: si mañana cada comercial
 * debe ver solo los suyos, se cambia AQUÍ y en ningún otro sitio. Por eso todo el acceso
 * pasa por esta función y no hay consultas sueltas repartidas por las pantallas.
 */
export const diagnostico = cache(async () => {
  const { member } = await requireMember();

  return {
    member,
    leads: {
      list: async (): Promise<Lead[]> =>
        [...seed.leads].sort((a, b) => b.recibidoEn.localeCompare(a.recibidoEn)),
      get: async (id: string): Promise<Lead> => {
        const l = seed.leads.find((x) => x.id === id);
        if (!l) notFound();
        return l;
      },
    },
    auditorias: {
      porLead: async (leadId: string): Promise<EjecucionAuditoria[]> =>
        seed.ejecuciones.filter((e) => e.leadId === leadId)
          .sort((a, b) => b.ejecutadaEn.localeCompare(a.ejecutadaEn)),
      recientes: async (n = 10): Promise<EjecucionAuditoria[]> =>
        [...seed.ejecuciones].sort((a, b) => b.ejecutadaEn.localeCompare(a.ejecutadaEn)).slice(0, n),
    },
  };
});
