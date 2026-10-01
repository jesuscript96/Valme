import { costUsd, type Usage } from "./pricing";

/** El mismo conjunto que `repo/types`. Aquí se declara aparte para que este módulo
 * no arrastre el modelo entero y se pueda probar aislado. */
type Provider = "anthropic" | "higgsfield" | "firecrawl" | "meta" | "resend";

/**
 * LA REGLA DEL ai_job.
 *
 * Ninguna llamada a un proveedor de IA sale del código directamente. Todas pasan por
 * `runJob`, que abre la fila, ejecuta, y la cierra con tokens y coste.
 *
 * Esto es lo que hace cierta la promesa de saber desde el primer día cuánto cuesta en IA
 * cada cliente. Sin la regla, a la tercera semana hay tres llamadas sueltas por ahí y el
 * dato ya no vale para nada — y nadie se entera hasta que alguien pregunta.
 */

export type JobSpec = {
  clientId: string;
  kind: string;      // brand_kit.extract | copy.generate | image.generate | landing.generate…
  provider: Provider;
  model?: string;
  input: unknown;
};

export type JobOutcome<T> = {
  output: T;
  /** De Anthropic. El coste se calcula a partir de aquí. */
  usage?: Usage;
  /** De Higgsfield (endpoint `/estimate`) o de un cálculo propio. */
  costUsd?: number;
  /** `request_id` de Higgsfield. Es la clave de deduplicación del webhook. */
  externalId?: string;
};

export type JobStore = {
  open: (spec: JobSpec) => Promise<string>;
  close: (
    id: string,
    result:
      | { status: "succeeded"; costUsd: number; usage?: Usage; externalId?: string; output: unknown }
      | { status: "failed"; error: string },
  ) => Promise<void>;
};

export async function runJob<T>(
  store: JobStore,
  spec: JobSpec,
  fn: (jobId: string) => Promise<JobOutcome<T>>,
): Promise<T> {
  const id = await store.open(spec);
  try {
    const r = await fn(id);
    await store.close(id, {
      status: "succeeded",
      costUsd: r.costUsd ?? (r.usage ? costUsd(r.usage) : 0),
      usage: r.usage,
      externalId: r.externalId,
      output: r.output,
    });
    return r.output;
  } catch (e) {
    await store.close(id, {
      status: "failed",
      error: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

/** Implementación en memoria: sirve para tests y para el modo sin base de datos. */
export function memoryJobStore(): JobStore & { rows: Map<string, Record<string, unknown>> } {
  const rows = new Map<string, Record<string, unknown>>();
  return {
    rows,
    async open(spec) {
      const id = crypto.randomUUID();
      rows.set(id, { ...spec, id, status: "running", createdAt: new Date().toISOString() });
      return id;
    },
    async close(id, result) {
      rows.set(id, { ...(rows.get(id) ?? {}), ...result, finishedAt: new Date().toISOString() });
    },
  };
}
