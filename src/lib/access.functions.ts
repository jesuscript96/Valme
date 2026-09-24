import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AccessDenied, requireClientAccess } from "@/lib/auth/guards.server";

export type MyAccess =
  | { allowed: false; reason: "sin_invitacion" | "desactivado" | "sin_rol" }
  | {
      allowed: true;
      userId: string;
      email: string;
      fullName: string | null;
      role: "super_admin" | "project_manager" | "equipo" | "cliente";
      fullPortfolio: boolean;
      aal: string | null;
    };

/**
 * Autorización VALME tras cualquier inicio de sesión (email o Google).
 * Google verifica quién eres; esta función decide si puedes entrar.
 */
export const getMyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyAccess> => {
    const { supabase, userId, claims } = context;
    const { data, error } = await supabase
      .from("user_access")
      .select("email, full_name, role, status, full_portfolio")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data) {
      // Cuenta sin invitación previa: se registra el rechazo y se elimina la cuenta.
      await supabaseAdmin.from("activity_events").insert({
        actor_id: userId,
        action: "acceso_rechazado_sin_invitacion",
        metadata: { provider: (claims as { app_metadata?: { provider?: string } })?.app_metadata?.provider ?? null },
      });
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { allowed: false, reason: "sin_invitacion" };
    }
    if (data.status === "desactivado") return { allowed: false, reason: "desactivado" };
    if (!data.role) return { allowed: false, reason: "sin_rol" };

    if (data.status === "invitado") {
      await supabaseAdmin.from("user_access").update({ status: "activo" }).eq("user_id", userId);
    }
    return {
      allowed: true,
      userId,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      fullPortfolio: data.full_portfolio,
      aal: ((claims as { aal?: string })?.aal as string) ?? null,
    };
  });

const SessionEvent = z.object({
  action: z.enum(["login_password_success", "login_google_success", "login_google_denied", "login_password_denied", "logout"]),
});

export const logSessionEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SessionEvent.parse(d))
  .handler(async ({ data, context }) => {
    // Solo metadatos mínimos; nunca tokens.
    await context.supabase.from("activity_events").insert({ actor_id: context.userId, action: data.action });
    return { ok: true };
  });

export const getClientSecure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ clientId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      await requireClientAccess(context.supabase, data.clientId);
    } catch (e) {
      if (e instanceof AccessDenied) return { denied: true as const };
      throw e;
    }
    const { data: client, error } = await context.supabase
      .from("clients")
      .select("id, nombre, sector, estado, progreso, objetivo")
      .eq("id", data.clientId)
      .maybeSingle();
    if (error) throw error;
    if (!client) return { denied: true as const };
    return { denied: false as const, client };
  });
