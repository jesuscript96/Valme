import { runJob, type JobStore } from "@valme/os/domain/aiJobs";
import type { AgentRun, AgentStepInput, QueueMessage } from "@valme/os/db/agentRuns";
import { AgentFailure, runAgent, type AgentDeps } from "./agent";
import { toolsFor } from "./tools";
import type { AuditToSave, ToolContext } from "./tools/types";

/**
 * UN MENSAJE DE LA COLA, DE PRINCIPIO A FIN.
 *
 *   leer fila → marcar running → latido → runJob(bucle del agente) → cerrar → archivar
 *
 * Qué pasa con cada desenlace:
 *  - Termina bien                → fila succeeded, mensaje archivado.
 *  - Fallo definitivo (rechazo,
 *    tope de pasos, cancelación) → fila failed, mensaje archivado.
 *  - Fallo pasajero (red, 5xx,
 *    base de datos)              → fila de vuelta a queued, el mensaje NO se archiva y
 *                                  reaparece al vencer su invisibilidad. Al superar el
 *                                  máximo de intentos, failed.
 *  - El worker muere a mitad     → el latido deja de alargar la invisibilidad y el
 *                                  mensaje vuelve solo a la cola.
 *
 * Cada intento abre su propio ai_job: el coste de un intento fallido también cuenta.
 */

export type RunsRepo = {
  get(id: string): Promise<AgentRun | null>;
  start(id: string, attempts: number): Promise<AgentRun | null>;
  finish(
    id: string,
    r:
      | { status: "succeeded"; result: unknown; aiJobId: string | null }
      | { status: "failed"; error: string; aiJobId: string | null },
  ): Promise<void>;
  requeue(id: string, error: string): Promise<void>;
  isCancelled(id: string): Promise<boolean>;
  appendStep(s: AgentStepInput): Promise<void>;
  queue: {
    extend(msgId: number, visibilitySeconds: number): Promise<void>;
    archive(msgId: number): Promise<void>;
  };
};

export type BrowserLike = { close(): Promise<void> };

export type ProcessDeps = {
  repo: RunsRepo;
  jobStore: JobStore;
  callModel: AgentDeps["callModel"];
  defaultModel: string;
  anthropicFeatures: boolean;
  openBrowser: () => Promise<BrowserLike>;
  saveAudit: (a: AuditToSave & { clientId: string; agentRunId: string }) => Promise<string>;
  cfg: { visibilitySeconds: number; maxAttempts: number; runTimeoutSeconds: number };
  log: (msg: string, extra?: Record<string, unknown>) => void;
};

export type Outcome = "succeeded" | "failed" | "retry" | "discarded";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TERMINALES = new Set(["succeeded", "failed", "cancelled"]);

export async function processMessage(msg: QueueMessage, deps: ProcessDeps): Promise<Outcome> {
  const { repo, log, cfg } = deps;
  const runId = msg.message?.run_id;

  if (typeof runId !== "string" || !UUID.test(runId)) {
    log("mensaje sin run_id válido: se descarta", { msgId: msg.msg_id });
    await repo.queue.archive(msg.msg_id);
    return "discarded";
  }

  const run = await repo.get(runId);
  if (!run || TERMINALES.has(run.status)) {
    log("la ejecución no existe o ya terminó: se descarta el mensaje", { runId, status: run?.status });
    await repo.queue.archive(msg.msg_id);
    return "discarded";
  }

  if (msg.read_ct > cfg.maxAttempts) {
    await repo.finish(runId, {
      status: "failed",
      error: `Superado el máximo de ${cfg.maxAttempts} intentos. Último error: ${run.error ?? "desconocido"}`,
      aiJobId: run.ai_job_id,
    });
    await repo.queue.archive(msg.msg_id);
    return "failed";
  }

  let tools;
  try {
    tools = toolsFor(run.tools);
  } catch (e) {
    await repo.finish(runId, { status: "failed", error: (e as Error).message, aiJobId: null });
    await repo.queue.archive(msg.msg_id);
    return "failed";
  }

  const started = await repo.start(runId, msg.read_ct);
  if (!started) {
    await repo.queue.archive(msg.msg_id);
    return "discarded";
  }

  const attempt = msg.read_ct;
  const model = run.model ?? deps.defaultModel;
  log("empieza", { runId, clientId: run.client_id, attempt, model, tools: tools.map((t) => t.name) });

  // Latido: mientras trabaja, el mensaje sigue invisible para otros workers.
  const latido = setInterval(() => {
    repo.queue.extend(msg.msg_id, cfg.visibilitySeconds).catch((e) =>
      log("no se ha podido alargar la invisibilidad", { runId, error: String(e) }),
    );
  }, Math.max(5, Math.floor(cfg.visibilitySeconds / 3)) * 1000);

  const abort = new AbortController();
  const tope = setTimeout(() => abort.abort(), cfg.runTimeoutSeconds * 1000);

  let browser: Promise<BrowserLike> | null = null;
  const ctx: ToolContext = {
    runId,
    clientId: run.client_id,
    browser: () => (browser ??= deps.openBrowser()) as ReturnType<ToolContext["browser"]>,
    saveAudit: (a) => deps.saveAudit({ ...a, clientId: run.client_id, agentRunId: runId }),
    signal: abort.signal,
  };

  let aiJobId: string | null = null;
  try {
    const result = await runJob(
      deps.jobStore,
      {
        clientId: run.client_id,
        kind: "agent.run",
        provider: "anthropic",
        model,
        input: { runId, attempt, goal: run.goal, tools: tools.map((t) => t.name) },
      },
      async (jobId) => {
        aiJobId = jobId;
        const r = await runAgent(
          { goal: run.goal, tools, maxSteps: run.max_steps },
          {
            callModel: deps.callModel,
            model,
            anthropicFeatures: deps.anthropicFeatures,
            ctx,
            isCancelled: () => repo.isCancelled(runId),
            recordStep: (s) => repo.appendStep({ ...s, runId, clientId: run.client_id, attempt }),
          },
        );
        return { output: { text: r.text, steps: r.steps }, usage: r.usage };
      },
    );

    await repo.finish(runId, { status: "succeeded", result, aiJobId });
    await repo.queue.archive(msg.msg_id);
    log("termina bien", { runId, steps: result.steps });
    return "succeeded";
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    // Cancelada desde fuera: la fila ya dice `cancelled` y no se pisa.
    if (await repo.isCancelled(runId).catch(() => false)) {
      log("cancelada", { runId });
      await repo.queue.archive(msg.msg_id);
      return "discarded";
    }

    // Lo que no es un fallo del agente (Supabase caído, un bug) también es pasajero.
    const retryable = e instanceof AgentFailure ? e.retryable : true;

    if (retryable && attempt < cfg.maxAttempts) {
      log("intento fallido, se reintentará", { runId, attempt, error: message });
      await repo.requeue(runId, `Intento ${attempt}: ${message}`).catch(() => {});
      return "retry";
    }

    log("falla", { runId, attempt, error: message });
    await repo.finish(runId, { status: "failed", error: message, aiJobId });
    await repo.queue.archive(msg.msg_id);
    return "failed";
  } finally {
    clearInterval(latido);
    clearTimeout(tope);
    if (browser) await (browser as Promise<BrowserLike>).then((b) => b.close()).catch(() => {});
  }
}
