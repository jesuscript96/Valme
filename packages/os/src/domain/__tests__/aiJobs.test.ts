import { strict as assert } from "node:assert";
import { test } from "node:test";
import { JobError, memoryJobStore, runJob } from "../aiJobs";

test("un job correcto se cierra con su coste calculado de los tokens", async () => {
  const store = memoryJobStore();
  const out = await runJob(store, { clientId: "c1", kind: "copy.generate", provider: "anthropic", input: {} },
    async () => ({
      output: "ok",
      // Opus 5.5 por defecto: 1M entrada ($4) + 100k salida ($2) + 1M de caché leída ($0,20)
      usage: { inputTokens: 1_000_000, outputTokens: 100_000, cacheReadTokens: 1_000_000, cacheWriteTokens: 0 },
    }));

  assert.equal(out, "ok");
  const row = [...store.rows.values()][0];
  assert.equal(row.status, "succeeded");
  assert.equal(row.costUsd, 4 + 2 + 0.2);
});

test("el coste usa la tarifa del modelo del job", async () => {
  const store = memoryJobStore();
  await runJob(store, { clientId: "c1", kind: "copy.generate", provider: "anthropic", model: "claude-opus-5", input: {} },
    async () => ({
      output: "ok",
      // Opus 5: 1M entrada ($5) + 100k salida ($2,50) + 1M de caché leída ($0,50)
      usage: { inputTokens: 1_000_000, outputTokens: 100_000, cacheReadTokens: 1_000_000, cacheWriteTokens: 0 },
    }));
  assert.equal([...store.rows.values()][0].costUsd, 5 + 2.5 + 0.5);
});

test("un job que falla queda registrado con su error y vuelve a lanzar", async () => {
  const store = memoryJobStore();
  await assert.rejects(
    runJob(store, { clientId: "c1", kind: "image.generate", provider: "higgsfield", input: {} },
      async () => { throw new Error("nsfw"); }),
    /nsfw/,
  );
  const row = [...store.rows.values()][0];
  assert.equal(row.status, "failed");
  assert.equal(row.error, "nsfw");
});

test("un coste explícito gana al calculado: Higgsfield no cobra por tokens", async () => {
  const store = memoryJobStore();
  await runJob(store, { clientId: "c1", kind: "image.generate", provider: "higgsfield", input: {} },
    async () => ({ output: null, costUsd: 0.094, externalId: "req_1" }));
  const row = [...store.rows.values()][0];
  assert.equal(row.costUsd, 0.094);
  assert.equal(row.externalId, "req_1");
});

test("un fallo que ya ha gastado deja su coste en la fila", async () => {
  const store = memoryJobStore();
  await assert.rejects(
    runJob(store, { clientId: "c1", kind: "agent.run", provider: "anthropic", input: {} },
      async () => {
        throw new JobError("máximo de pasos", {
          inputTokens: 1_000_000, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0,
        });
      }),
    /máximo de pasos/,
  );
  const row = [...store.rows.values()][0];
  assert.equal(row.status, "failed");
  assert.equal(row.costUsd, 4);
});
