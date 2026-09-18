import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Approval = {
  id: string;
  accion: string;
  tipo: string;
  estado: string;
  prioridad: string;
  confianza: number;
  evidencia: string | null;
  impacto: string | null;
  sla_vence: string | null;
  cliente: string;
  agente: string;
};

export type CommandCenter = {
  cartera: {
    total: number;
    techo: number;
    piloto: number;
    revision: number;
    bloqueado: number;
    onboarding: number;
    plazas: number;
    altasSemanales: number;
  };
  atencion: {
    pendientes: number;
    criticas: number;
    slaVencidos: number;
    bloqueos: number;
  };
  agentes: Array<{
    id: string;
    nombre: string;
    especialidad: string;
    carga: number;
    disponibilidad: string;
    calidad: number;
    errores: number;
  }>;
  cola: Approval[];
  actividad: Array<{
    id: string;
    descripcion: string;
    resultado: string | null;
    created_at: string;
    cliente: string;
    agente: string;
  }>;
  decisiones: Array<{
    id: string;
    decision: string;
    motivo: string | null;
    created_at: string;
    accion: string;
  }>;
};

export const getCommandCenter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CommandCenter> => {
    const supabase = context.supabase;

    const [clientsRes, agentsRes, approvalsRes, activityRes, decisionsRes] = await Promise.all([
      supabase.from("clients").select("id, estado"),
      supabase.from("agents").select("*").order("carga", { ascending: false }),
      supabase
        .from("approvals")
        .select(
          "id, accion, tipo, estado, prioridad, confianza, evidencia, impacto, sla_vence, clients(nombre), agents(nombre)",
        )
        .in("estado", ["propuesto_ia", "en_revision", "bloqueado"])
        .order("created_at", { ascending: true }),
      supabase
        .from("activity")
        .select("id, descripcion, resultado, created_at, clients(nombre), agents(nombre)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("decisions")
        .select("id, decision, motivo, created_at, approvals(accion)")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const error =
      clientsRes.error ?? agentsRes.error ?? approvalsRes.error ?? activityRes.error ?? decisionsRes.error;
    if (error) throw new Error(error.message);

    const clients = clientsRes.data ?? [];
    const count = (estado: string) => clients.filter((c) => c.estado === estado).length;

    const ahora = Date.now();
    const cola: Approval[] = (approvalsRes.data ?? []).map((row) => ({
      id: row.id,
      accion: row.accion,
      tipo: row.tipo,
      estado: row.estado,
      prioridad: row.prioridad,
      confianza: row.confianza,
      evidencia: row.evidencia,
      impacto: row.impacto,
      sla_vence: row.sla_vence,
      cliente: (row.clients as { nombre: string } | null)?.nombre ?? "Sin cliente",
      agente: (row.agents as { nombre: string } | null)?.nombre ?? "Sin agente",
    }));

    const techo = 100;
    const total = clients.length;

    return {
      cartera: {
        total,
        techo,
        piloto: count("piloto_automatico"),
        revision: count("revision"),
        bloqueado: count("bloqueado"),
        onboarding: count("onboarding"),
        plazas: Math.max(techo - total, 0),
        altasSemanales: 4,
      },
      atencion: {
        pendientes: cola.length,
        criticas: cola.filter((a) => a.prioridad === "critica").length,
        slaVencidos: cola.filter((a) => a.sla_vence && new Date(a.sla_vence).getTime() < ahora).length,
        bloqueos: cola.filter((a) => a.estado === "bloqueado").length,
      },
      agentes: agentsRes.data ?? [],
      cola,
      actividad: (activityRes.data ?? []).map((row) => ({
        id: row.id,
        descripcion: row.descripcion,
        resultado: row.resultado,
        created_at: row.created_at,
        cliente: (row.clients as { nombre: string } | null)?.nombre ?? "Sin cliente",
        agente: (row.agents as { nombre: string } | null)?.nombre ?? "Sin agente",
      })),
      decisiones: (decisionsRes.data ?? []).map((row) => ({
        id: row.id,
        decision: row.decision,
        motivo: row.motivo,
        created_at: row.created_at,
        accion: (row.approvals as { accion: string } | null)?.accion ?? "Acción eliminada",
      })),
    };
  });

const decisionSchema = z.object({
  approvalId: z.string().uuid(),
  decision: z.enum(["aprobado", "devuelto", "en_revision"]),
  motivo: z.string().max(400).optional(),
});

export const decidirAprobacion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => decisionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    // Una devolución mantiene el problema abierto; iniciar revisión no resuelve
    // un bloqueo. Sólo la aprobación cierra la decisión humana.
    const nuevoEstado =
      data.decision === "aprobado" ? "aprobado" : data.decision === "devuelto" ? "propuesto_ia" : "en_revision";

    const { error: updateError } = await supabase
      .from("approvals")
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq("id", data.approvalId);
    if (updateError) throw new Error(updateError.message);

    const { error: insertError } = await supabase.from("decisions").insert({
      approval_id: data.approvalId,
      decision: data.decision,
      motivo: data.motivo ?? null,
      decidido_por: context.userId,
    });
    if (insertError) throw new Error(insertError.message);

    return { ok: true, estado: nuevoEstado };
  });
