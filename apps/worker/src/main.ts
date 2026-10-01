import { createServer } from "node:http";
import { agentRunsRepo, saveAudit } from "@valme/os/db/agentRuns";
import { serviceClient } from "@valme/os/db/client";
import { supabaseJobStore } from "@valme/os/db/jobStore";
import { anthropic, esAnthropic, MODEL } from "@valme/os/providers/anthropic";
import { loadConfig } from "./config";
import { startLoop } from "./loop";
import { processMessage } from "./process";
import { BrowserSession } from "./tools/browser";
import { crearGuarda } from "./urlGuard";

/**
 * ARRANQUE DEL WORKER.
 *
 * Un proceso largo: consume la cola `agent_runs` y expone GET /health para Coolify.
 * /health responde 503 si hace demasiado que no consigue leer la cola, que es la señal
 * de que algo va mal aunque el proceso siga vivo.
 */

const log = (msg: string, extra?: Record<string, unknown>) =>
  console.log(JSON.stringify({ t: new Date().toISOString(), msg, ...extra }));

const cfg = loadConfig();
const db = serviceClient();
const repo = agentRunsRepo(db);

if (!process.env.SANDBOX_URL) {
  log("AVISO: sin SANDBOX_URL; las páginas se cargan con un Chrome local. Sólo para desarrollo.");
}

const loop = startLoop({
  read: (vt, qty) => repo.queue.read(vt, qty),
  process: (msg) =>
    processMessage(msg, {
      repo,
      jobStore: supabaseJobStore(db),
      callModel: (params, signal) => anthropic().beta.messages.stream(params, { signal }).finalMessage(),
      defaultModel: MODEL,
      anthropicFeatures: esAnthropic(),
      openBrowser: () => BrowserSession.open(crearGuarda()),
      saveAudit: (a) => saveAudit(db, a),
      cfg: {
        visibilitySeconds: cfg.WORKER_VISIBILITY_SECONDS,
        maxAttempts: cfg.WORKER_MAX_ATTEMPTS,
        runTimeoutSeconds: cfg.WORKER_RUN_TIMEOUT_SECONDS,
      },
      log,
    }),
  concurrency: cfg.WORKER_CONCURRENCY,
  visibilitySeconds: cfg.WORKER_VISIBILITY_SECONDS,
  pollMs: cfg.WORKER_POLL_MS,
  log,
});

const server = createServer((req, res) => {
  if (req.url !== "/health") {
    res.writeHead(404).end();
    return;
  }
  const staleMs = Math.max(60_000, cfg.WORKER_POLL_MS * 10);
  const healthy = Date.now() - loop.state.lastPollAt < staleMs;
  res.writeHead(healthy ? 200 : 503, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: healthy, ...loop.state, model: MODEL }));
});
server.listen(cfg.PORT, () => log("worker en marcha", { port: cfg.PORT, model: MODEL, concurrency: cfg.WORKER_CONCURRENCY }));

let cerrando = false;
async function cerrar(signal: string) {
  if (cerrando) return;
  cerrando = true;
  log("cerrando", { signal });
  server.close();
  await loop.shutdown(25_000);
  process.exit(0);
}
process.on("SIGTERM", () => void cerrar("SIGTERM"));
process.on("SIGINT", () => void cerrar("SIGINT"));
