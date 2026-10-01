import type { SupabaseClient } from "@supabase/supabase-js";
import { unwrap } from "./client";

/**
 * EJECUCIONES DE AGENTE Y SU COLA.
 *
 * La cola (pgmq, cola `agent_runs`) sólo lleva `{ run_id }`. Todo lo demás —la tarea,
 * las herramientas permitidas, el estado y el resultado— vive en la fila de
 * `agent_runs`, que es lo que la web enseña. Así un mensaje perdido o repetido no
 * puede inventar trabajo: el worker siempre parte de la fila.
 *
 * Las funciones de cola son RPC a envoltorios de la migración que sólo puede ejecutar
 * service_role.
 */

export type AgentRunStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type AgentRun = {
  id: string;
  client_id: string;
  goal: string;
  tools: string[];
  max_steps: number;
  model: string | null;
  status: AgentRunStatus;
  result: unknown;
  error: string | null;
  attempts: number;
  ai_job_id: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type QueueMessage = {
  msg_id: number;
  read_ct: number;
  enqueued_at: string;
  message: { run_id?: unknown };
};

export type AgentStepInput = {
  runId: string;
  clientId: string;
  attempt: number;
  idx: number;
  kind: "assistant" | "tool_call";
  toolName?: string;
  input?: unknown;
  output?: unknown;
  isError?: boolean;
  durationMs?: number;
};

export function agentRunsRepo(db: SupabaseClient) {
  return {
    /** Crea la fila y encola, en una transacción (función `create_agent_run`). */
    async create(opts: {
      clientId: string;
      goal: string;
      tools?: string[];
      maxSteps?: number;
      model?: string | null;
    }): Promise<string> {
      return unwrap<string>(
        await db.rpc("create_agent_run", {
          p_client_id: opts.clientId,
          p_goal: opts.goal,
          p_tools: opts.tools ?? [],
          p_max_steps: opts.maxSteps ?? 40,
          p_model: opts.model ?? null,
        }),
        "create_agent_run",
      );
    },

    async get(id: string): Promise<AgentRun | null> {
      const { data, error } = await db.from("agent_runs").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(`agent_runs.get: ${error.message}`);
      return data as AgentRun | null;
    },

    /**
     * Marca la ejecución como `running` y suma un intento. Sólo si sigue viva: una
     * ejecución ya terminada o cancelada devuelve null y el mensaje se archiva.
     */
    async start(id: string, attempts: number): Promise<AgentRun | null> {
      const { data, error } = await db
        .from("agent_runs")
        .update({ status: "running", attempts, started_at: new Date().toISOString(), error: null })
        .eq("id", id)
        .in("status", ["queued", "running"])
        .select("*")
        .maybeSingle();
      if (error) throw new Error(`agent_runs.start: ${error.message}`);
      return data as AgentRun | null;
    },

    async finish(
      id: string,
      r:
        | { status: "succeeded"; result: unknown; aiJobId: string | null }
        | { status: "failed"; error: string; aiJobId: string | null },
    ): Promise<void> {
      const patch =
        r.status === "succeeded"
          ? { status: r.status, result: r.result, error: null, ai_job_id: r.aiJobId }
          : { status: r.status, error: r.error, ai_job_id: r.aiJobId };
      const { error } = await db
        .from("agent_runs")
        .update({ ...patch, finished_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(`agent_runs.finish: ${error.message}`);
    },

    /** ¿La han cancelado desde fuera mientras corría? Se mira entre paso y paso. */
    async isCancelled(id: string): Promise<boolean> {
      const { data, error } = await db.from("agent_runs").select("status").eq("id", id).single();
      if (error) throw new Error(`agent_runs.isCancelled: ${error.message}`);
      return (data as { status: AgentRunStatus }).status === "cancelled";
    },

    async appendStep(s: AgentStepInput): Promise<void> {
      const { error } = await db.from("agent_steps").upsert(
        {
          run_id: s.runId,
          client_id: s.clientId,
          attempt: s.attempt,
          idx: s.idx,
          kind: s.kind,
          tool_name: s.toolName ?? null,
          input: s.input ?? null,
          output: s.output ?? null,
          is_error: s.isError ?? false,
          duration_ms: s.durationMs ?? null,
        },
        { onConflict: "run_id,attempt,idx" },
      );
      if (error) throw new Error(`agent_steps.append: ${error.message}`);
    },

    queue: {
      async read(visibilitySeconds: number, qty = 1): Promise<QueueMessage[]> {
        return unwrap<QueueMessage[]>(
          await db.rpc("agent_queue_read", { p_vt: visibilitySeconds, p_qty: qty }),
          "agent_queue_read",
        );
      },
      async extend(msgId: number, visibilitySeconds: number): Promise<void> {
        const { error } = await db.rpc("agent_queue_extend", { p_msg_id: msgId, p_vt: visibilitySeconds });
        if (error) throw new Error(`agent_queue_extend: ${error.message}`);
      },
      async archive(msgId: number): Promise<void> {
        const { error } = await db.rpc("agent_queue_archive", { p_msg_id: msgId });
        if (error) throw new Error(`agent_queue_archive: ${error.message}`);
      },
    },
  };
}

export type AgentRunsRepo = ReturnType<typeof agentRunsRepo>;

/** Guarda el informe de una auditoría. `hallazgos` es el informe entero. */
export async function saveAudit(
  db: SupabaseClient,
  a: {
    dominio: string;
    herramientas: string[];
    clientId?: string | null;
    agentRunId?: string | null;
    duracionMs: number;
    senales: number;
    resumen: unknown;
    hallazgos: unknown;
    fuentesNoDisponibles: unknown;
  },
): Promise<string> {
  const row = unwrap<{ id: string }>(
    await db
      .from("audits")
      .insert({
        dominio: a.dominio,
        herramientas: a.herramientas,
        client_id: a.clientId ?? null,
        agent_run_id: a.agentRunId ?? null,
        duracion_ms: a.duracionMs,
        senales: a.senales,
        resumen: a.resumen,
        hallazgos: a.hallazgos,
        fuentes_no_disponibles: a.fuentesNoDisponibles,
      })
      .select("id")
      .single(),
    "audits.insert",
  );
  return row.id;
}
