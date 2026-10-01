import { strict as assert } from "node:assert";
import { test } from "node:test";
import Anthropic from "@anthropic-ai/sdk";
import { memoryJobStore } from "@valme/os/domain/aiJobs";
import type { AgentRun, QueueMessage } from "@valme/os/db/agentRuns";
import { processMessage, type ProcessDeps, type RunsRepo } from "../process";
import { startLoop } from "../loop";

const RUN_ID = "11111111-1111-4111-8111-111111111111";

const run = (over: Partial<AgentRun> = {}): AgentRun => ({
  id: RUN_ID, client_id: "c1", goal: "audita ejemplo.es", tools: [], max_steps: 5, model: null,
  status: "queued", result: null, error: null, attempts: 0, ai_job_id: null,
  created_at: "", started_at: null, finished_at: null, ...over,
});

const qmsg = (read_ct = 1, run_id: unknown = RUN_ID): QueueMessage =>
  ({ msg_id: 7, read_ct, enqueued_at: "", message: { run_id } });

const texto = (t: string) =>
  ({ content: [{ type: "text", text: t }], stop_reason: "end_turn", usage: { input_tokens: 10, output_tokens: 5 } }) as unknown as Anthropic.Beta.BetaMessage;

function fakeRepo(inicial: AgentRun | null) {
  let fila = inicial;
  const ev: string[] = [];
  const repo: RunsRepo = {
    get: async () => fila,
    start: async (_id, attempts) => { fila = { ...fila!, status: "running", attempts }; ev.push("start"); return fila; },
    finish: async (_id, r) => { fila = { ...fila!, status: r.status, ...(r.status === "succeeded" ? { result: r.result } : { error: r.error }) }; ev.push(`finish:${r.status}`); },
    requeue: async (_id, error) => { fila = { ...fila!, status: "queued", error }; ev.push("requeue"); },
    isCancelled: async () => fila?.status === "cancelled",
    appendStep: async () => { ev.push("step"); },
    queue: {
      extend: async () => { ev.push("extend"); },
      archive: async () => { ev.push("archive"); },
    },
  };
  return { repo, ev, fila: () => fila };
}

function deps(repo: RunsRepo, callModel: ProcessDeps["callModel"]): ProcessDeps & { store: ReturnType<typeof memoryJobStore> } {
  const store = memoryJobStore();
  return {
    store,
    repo,
    jobStore: store,
    callModel,
    defaultModel: "claude-opus-5-5",
    anthropicFeatures: true,
    openBrowser: async () => ({ close: async () => {} }),
    saveAudit: async () => "a1",
    cfg: { visibilitySeconds: 60, maxAttempts: 3, runTimeoutSeconds: 60 },
    log: () => {},
  };
}

test("una ejecución que termina bien queda succeeded, con su ai_job, y el mensaje se archiva", async () => {
  const { repo, ev, fila } = fakeRepo(run());
  const d = deps(repo, async () => texto("listo"));
  assert.equal(await processMessage(qmsg(), d), "succeeded");
  assert.deepEqual(ev.filter((e) => e !== "step" && e !== "extend"), ["start", "finish:succeeded", "archive"]);
  assert.deepEqual(fila()!.result, { text: "listo", steps: 1 });
  const job = [...d.store.rows.values()][0];
  assert.equal(job.kind, "agent.run");
  assert.equal(job.status, "succeeded");
  assert.ok((job.costUsd as number) > 0);
});

test("un fallo pasajero devuelve la fila a queued y NO archiva: la cola la reintentará", async () => {
  const { repo, ev, fila } = fakeRepo(run());
  const d = deps(repo, async () => { throw new Anthropic.APIError(529, { type: "error" }, "overloaded", new Headers()); });
  assert.equal(await processMessage(qmsg(1), d), "retry");
  assert.ok(ev.includes("requeue"));
  assert.ok(!ev.includes("archive"));
  assert.equal(fila()!.status, "queued");
  // El intento fallido también queda apuntado como job.
  assert.equal([...d.store.rows.values()][0].status, "failed");
});

test("el mismo fallo pasajero en el último intento ya es definitivo", async () => {
  const { repo, ev } = fakeRepo(run());
  const d = deps(repo, async () => { throw new Anthropic.APIError(529, { type: "error" }, "overloaded", new Headers()); });
  assert.equal(await processMessage(qmsg(3), d), "failed");
  assert.ok(ev.includes("finish:failed") && ev.includes("archive"));
});

test("un fallo definitivo (rechazo) no se reintenta", async () => {
  const { repo, ev } = fakeRepo(run());
  const d = deps(repo, async () => ({ content: [], stop_reason: "refusal", usage: {} }) as unknown as Anthropic.Beta.BetaMessage);
  assert.equal(await processMessage(qmsg(1), d), "failed");
  assert.ok(ev.includes("finish:failed") && ev.includes("archive"));
});

test("mensajes basura, ejecuciones ya terminadas e intentos agotados se archivan sin llamar al modelo", async () => {
  const nunca: ProcessDeps["callModel"] = async () => { throw new Error("no debería llamarse"); };

  const a = fakeRepo(run());
  assert.equal(await processMessage(qmsg(1, "no-es-uuid"), deps(a.repo, nunca)), "discarded");
  assert.deepEqual(a.ev, ["archive"]);

  const b = fakeRepo(run({ status: "succeeded" }));
  assert.equal(await processMessage(qmsg(), deps(b.repo, nunca)), "discarded");

  const c = fakeRepo(run({ status: "running", error: "se cayó el worker" }));
  assert.equal(await processMessage(qmsg(4), deps(c.repo, nunca)), "failed");
  assert.match(c.fila()!.error!, /máximo de 3 intentos.*se cayó el worker/);

  const e = fakeRepo(run({ tools: ["rm_rf"] }));
  assert.equal(await processMessage(qmsg(), deps(e.repo, nunca)), "failed");
  assert.match(e.fila()!.error!, /desconocidas/);
});

test("el consumidor procesa lo que lee y para limpio", async () => {
  const lotes = [[qmsg()], [] as QueueMessage[]];
  const procesados: number[] = [];
  const loop = startLoop({
    read: async () => lotes.shift() ?? [],
    process: async (m) => { procesados.push(m.msg_id); return "succeeded"; },
    concurrency: 2, visibilitySeconds: 30, pollMs: 10, log: () => {},
  });
  await new Promise((r) => setTimeout(r, 60));
  await loop.shutdown(1000);
  assert.deepEqual(procesados, [7]);
  assert.equal(loop.state.active, 0);
  assert.ok(loop.state.lastPollAt > 0);
});
