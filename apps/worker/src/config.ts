import { z } from "zod";

/**
 * Configuración del worker, validada al arrancar.
 *
 * Un worker mal configurado tiene que caerse en el primer segundo y decir qué falta, no
 * quedarse vivo consumiendo la cola y fallando cada ejecución con un 401.
 */
const Esquema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // El cliente de Claude acepta cualquiera de los dos nombres (ver providers/anthropic).
  OS_LLM_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Navegador del sandbox: ws://sandbox:3000/<token>. Sin él, se lanza Chrome local
  // (sólo para desarrollo: en servidor el worker no debe cargar páginas de terceros).
  SANDBOX_URL: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(8080),
  // Cuánto tiempo queda invisible un mensaje leído. El latido lo va alargando mientras
  // el agente trabaja; si el worker muere, el mensaje vuelve a la cola pasado este plazo.
  WORKER_VISIBILITY_SECONDS: z.coerce.number().int().min(30).default(120),
  WORKER_POLL_MS: z.coerce.number().int().min(250).default(3000),
  // Ejecuciones a la vez. Cada una lleva su propio contexto de navegador.
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(1),
  // Intentos por ejecución antes de darla por fallida (cuenta el read_ct de pgmq).
  WORKER_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(3),
  // Tope de duración de una ejecución, en segundos.
  WORKER_RUN_TIMEOUT_SECONDS: z.coerce.number().int().min(60).default(1800),
});

export type Config = z.infer<typeof Esquema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const r = Esquema.safeParse(env);
  if (!r.success) {
    const faltan = r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  ");
    throw new Error(`Configuración del worker incompleta:\n  ${faltan}`);
  }
  if (!r.data.OS_LLM_API_KEY && !r.data.ANTHROPIC_API_KEY) {
    throw new Error("Configuración del worker incompleta:\n  OS_LLM_API_KEY (o ANTHROPIC_API_KEY): falta");
  }
  return r.data;
}
