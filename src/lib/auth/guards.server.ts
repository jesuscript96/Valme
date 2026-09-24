import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Sb = SupabaseClient<Database>;
export type ValmeRole = Database["public"]["Enums"]["valme_role"];

export class AccessDenied extends Error {
  constructor(message = "Acceso denegado") {
    super(message);
    this.name = "AccessDenied";
  }
}

/** Rol activo del usuario de la sesión (o null). Siempre consultado en servidor. */
export async function currentRole(supabase: Sb): Promise<ValmeRole | null> {
  const { data, error } = await supabase.rpc("current_valme_role");
  if (error) throw error;
  return (data as ValmeRole | null) ?? null;
}

export async function requireRole(supabase: Sb, allowed: ValmeRole[]): Promise<ValmeRole> {
  const role = await currentRole(supabase);
  if (!role || !allowed.includes(role)) throw new AccessDenied();
  return role;
}

/** Nunca se confía en el client_id del navegador: la base de datos decide. */
export async function requireClientAccess(supabase: Sb, clientId: string): Promise<void> {
  const { data, error } = await supabase.rpc("has_client_access", { _client_id: clientId });
  if (error) throw error;
  if (!data) throw new AccessDenied();
}
