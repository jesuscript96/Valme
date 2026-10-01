import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobStore } from "@valme/os/domain/aiJobs";
import { unwrap } from "./client";

/**
 * `JobStore` sobre la tabla `ai_jobs`. Es lo que hace que `runJob` deje fila en la base
 * de datos en vez de en memoria: el coste por cliente sale de aquí.
 *
 * Recibe el cliente por parámetro para poder probarlo con uno falso.
 */
export function supabaseJobStore(db: SupabaseClient): JobStore {
  return {
    async open(spec) {
      const row = unwrap<{ id: string }>(
        await db
          .from("ai_jobs")
          .insert({
            client_id: spec.clientId,
            kind: spec.kind,
            provider: spec.provider,
            model: spec.model ?? null,
            status: "running",
            input: spec.input ?? null,
          })
          .select("id")
          .single(),
        "ai_jobs.open",
      );
      return row.id;
    },

    async close(id, result) {
      const patch =
        result.status === "succeeded"
          ? {
              status: "succeeded",
              cost_usd: result.costUsd,
              input_tokens: result.usage?.inputTokens ?? null,
              output_tokens: result.usage?.outputTokens ?? null,
              cache_read_tokens: result.usage?.cacheReadTokens ?? null,
              cache_write_tokens: result.usage?.cacheWriteTokens ?? null,
              external_id: result.externalId ?? null,
              output: result.output ?? null,
              finished_at: new Date().toISOString(),
            }
          : {
              status: "failed",
              error: result.error,
              cost_usd: result.costUsd ?? null,
              input_tokens: result.usage?.inputTokens ?? null,
              output_tokens: result.usage?.outputTokens ?? null,
              cache_read_tokens: result.usage?.cacheReadTokens ?? null,
              cache_write_tokens: result.usage?.cacheWriteTokens ?? null,
              finished_at: new Date().toISOString(),
            };
      const { error } = await db.from("ai_jobs").update(patch).eq("id", id);
      if (error) throw new Error(`ai_jobs.close: ${error.message}`);
    },
  };
}
