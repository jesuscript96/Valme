import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isSeoAuditRemoteEnabled } from "@/lib/seo-audit/repository.server";

/**
 * Entrega la estructura del centro de mando (V2) solo a usuarios internos
 * activos. Ya no existe un index.html público en /v2: sin sesión válida no
 * hay dashboard. Los recursos /v2/scripts, /v2/styles y /v2/assets siguen
 * siendo públicos, pero sin esta estructura no forman una aplicación
 * navegable y nunca deben contener datos reales.
 */
export const getV2Shell = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_access")
      .select("role, status")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    const internal =
      data &&
      data.status !== "desactivado" &&
      ["super_admin", "project_manager", "equipo"].includes(data.role ?? "");
    if (!internal) return { allowed: false as const };
    const { V2_SHELL_HTML } = await import("./v2/shell.server");
    return {
      allowed: true as const,
      html: V2_SHELL_HTML,
      seoAuditMode: isSeoAuditRemoteEnabled() ? ("supabase" as const) : ("local-demo" as const),
    };
  });
