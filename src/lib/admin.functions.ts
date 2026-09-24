import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireRole } from "@/lib/auth/guards.server";

const Role = z.enum(["super_admin", "project_manager", "equipo", "cliente"]);

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getAdminData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRole(context.supabase, ["super_admin"]);
    const sb = context.supabase;
    const [users, clients, assignments, events] = await Promise.all([
      sb.from("user_access").select("user_id, email, full_name, role, status, full_portfolio, invited_at").order("invited_at"),
      sb.from("clients").select("id, nombre").order("nombre"),
      sb.from("user_client_access").select("user_id, client_id, role, status"),
      sb.from("activity_events").select("id, actor_id, action, client_id, target_user_id, created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    for (const r of [users, clients, assignments, events]) if (r.error) throw r.error;
    return { users: users.data!, clients: clients.data!, assignments: assignments.data!, events: events.data! };
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().trim().toLowerCase().email().max(255), fullName: z.string().trim().max(120).optional(), role: Role }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireRole(context.supabase, ["super_admin"]);
    const sb = await admin();
    const origin = new URL(getRequest().url).origin;
    const { data: inv, error } = await sb.auth.admin.inviteUserByEmail(data.email, { redirectTo: `${origin}/reset-password` });
    if (error) throw new Error(`No se pudo invitar: ${error.message}`);
    const { error: e2 } = await sb.from("user_access").insert({
      user_id: inv.user.id, email: data.email, full_name: data.fullName ?? null, role: data.role, status: "invitado", invited_by: context.userId,
    });
    if (e2) throw e2;
    await sb.from("activity_events").insert({ actor_id: context.userId, action: "usuario_invitado", target_user_id: inv.user.id, metadata: { role: data.role } });
    return { ok: true };
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), role: Role.optional(), status: z.enum(["activo", "desactivado"]).optional(), fullPortfolio: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireRole(context.supabase, ["super_admin"]);
    if (data.userId === context.userId && (data.status === "desactivado" || (data.role && data.role !== "super_admin"))) {
      throw new Error("No puedes retirarte a ti mismo el acceso de Super Admin.");
    }
    const sb = await admin();
    const patch: { role?: z.infer<typeof Role>; status?: string; full_portfolio?: boolean } = {};
    if (data.role) patch.role = data.role;
    if (data.status) patch.status = data.status;
    if (data.fullPortfolio !== undefined) patch.full_portfolio = data.fullPortfolio;
    const { error } = await sb.from("user_access").update(patch).eq("user_id", data.userId);
    if (error) throw error;
    if (data.status === "desactivado") await sb.auth.admin.signOut(data.userId).catch(() => undefined);
    const action = data.role ? "cambio_de_rol" : data.status === "desactivado" ? "usuario_desactivado" : data.status === "activo" ? "usuario_reactivado" : "cambio_de_cartera";
    await sb.from("activity_events").insert({ actor_id: context.userId, action, target_user_id: data.userId, metadata: patch });
    return { ok: true };
  });

export const setClientAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), clientId: z.string().uuid(), grant: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireRole(context.supabase, ["super_admin"]);
    const sb = await admin();
    const { data: u, error: eu } = await sb.from("user_access").select("role").eq("user_id", data.userId).single();
    if (eu) throw eu;
    const { error } = await sb.from("user_client_access").upsert(
      { user_id: data.userId, client_id: data.clientId, role: u.role, status: data.grant ? "activo" : "retirado", granted_by: context.userId },
      { onConflict: "user_id,client_id" },
    );
    if (error) throw error;
    await sb.from("activity_events").insert({
      actor_id: context.userId, action: data.grant ? "cliente_asignado" : "acceso_retirado", target_user_id: data.userId, client_id: data.clientId,
    });
    return { ok: true };
  });
