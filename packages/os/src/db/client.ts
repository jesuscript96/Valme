import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@valme/os/providers/config";

/**
 * Cliente de Supabase con la clave de servicio.
 *
 * Se salta RLS: lo usan el worker y el código de servidor que escribe lo que el
 * navegador nunca puede escribir (ai_jobs, agent_steps, auditorías). Por eso este
 * módulo lleva `server-only` y la clave no lleva prefijo `NEXT_PUBLIC_`.
 *
 * Quien lo use filtra por `client_id` él mismo: aquí no hay sesión que lo haga.
 */
let cached: SupabaseClient | null = null;

export function serviceClient(): SupabaseClient {
  requireEnv("supabase");
  cached ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Convierte el `{ data, error }` de supabase-js en un valor o una excepción. */
export function unwrap<T>(res: { data: unknown; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  if (res.data === null || res.data === undefined) throw new Error(`${what}: sin datos`);
  return res.data as T;
}
