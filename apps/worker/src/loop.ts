import type { QueueMessage } from "@valme/os/db/agentRuns";
import type { Outcome } from "./process";

/**
 * EL CONSUMIDOR DE LA COLA.
 *
 * Lee de pgmq hasta `concurrency` mensajes a la vez y procesa cada uno por su cuenta.
 * Si la cola está vacía, espera `pollMs`. Al recibir SIGTERM deja de leer y espera a
 * que terminen las ejecuciones en marcha; si no les da tiempo, sus mensajes vuelven
 * solos a la cola cuando vence la invisibilidad.
 */

export type LoopDeps = {
  read: (visibilitySeconds: number, qty: number) => Promise<QueueMessage[]>;
  process: (msg: QueueMessage) => Promise<Outcome>;
  concurrency: number;
  visibilitySeconds: number;
  pollMs: number;
  log: (msg: string, extra?: Record<string, unknown>) => void;
};

export type LoopState = {
  active: number;
  lastPollAt: number;
  lastError: string | null;
  processed: number;
};

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
  });

export function startLoop(deps: LoopDeps) {
  const state: LoopState = { active: 0, lastPollAt: 0, lastError: null, processed: 0 };
  const stop = new AbortController();
  const inFlight = new Set<Promise<void>>();

  async function tick(): Promise<void> {
    while (!stop.signal.aborted) {
      const free = deps.concurrency - state.active;
      if (free <= 0) {
        await Promise.race([...inFlight, sleep(deps.pollMs, stop.signal)]);
        continue;
      }

      let msgs: QueueMessage[] = [];
      try {
        msgs = await deps.read(deps.visibilitySeconds, free);
        state.lastPollAt = Date.now();
        state.lastError = null;
      } catch (e) {
        state.lastError = e instanceof Error ? e.message : String(e);
        deps.log("no se ha podido leer la cola", { error: state.lastError });
      }

      for (const m of msgs) {
        state.active++;
        const p = deps
          .process(m)
          .catch((e) => {
            deps.log("error no controlado procesando un mensaje", { msgId: m.msg_id, error: String(e) });
          })
          .then(() => {
            state.active--;
            state.processed++;
            inFlight.delete(p);
          });
        inFlight.add(p);
      }

      if (msgs.length === 0) await sleep(deps.pollMs, stop.signal);
    }
  }

  const running = tick();

  return {
    state,
    /** Deja de leer y espera a lo que está en marcha, como mucho `graceMs`. */
    async shutdown(graceMs: number): Promise<void> {
      stop.abort();
      await running;
      await Promise.race([
        Promise.allSettled([...inFlight]),
        new Promise((r) => setTimeout(r, graceMs)),
      ]);
    },
  };
}
