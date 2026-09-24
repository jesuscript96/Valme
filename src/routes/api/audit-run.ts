import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { runSeoAudit } from "@/lib/seo-audit/engine.server";

/**
 * Ejecuta la auditoría real sobre el dominio autorizado.
 * Requiere sesión válida y rol interno; el navegador nunca decide el permiso.
 */
export const Route = createFileRoute("/api/audit-run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = (body: unknown, status = 200): Response =>
          new Response(JSON.stringify(body), {
            status,
            headers: { "content-type": "application/json", "cache-control": "no-store" },
          });

        const SUPABASE_URL = process.env["SUPABASE_URL"];
        const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return json({ error: "La conexión con la base de datos no está disponible." }, 500);
        }

        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token || token.split(".").length !== 3) {
          return json({ error: "Inicia sesión para ejecutar una auditoría." }, 401);
        }

        const key = SUPABASE_PUBLISHABLE_KEY;
        const supabase = createClient<Database>(SUPABASE_URL, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            headers: { Authorization: `Bearer ${token}` },
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
                headers.delete("Authorization");
              }
              headers.set("apikey", key);
              if (!headers.get("Authorization")) headers.set("Authorization", `Bearer ${token}`);
              return fetch(input, { ...init, headers });
            },
          },
        });

        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (claimsError || !userId) {
          return json({ error: "Tu sesión ha caducado. Vuelve a iniciar sesión." }, 401);
        }

        const { data: access } = await supabase
          .from("user_access")
          .select("role, status")
          .eq("user_id", userId)
          .maybeSingle();

        const internalRoles = ["super_admin", "project_manager", "equipo"];
        if (!access || access.status !== "activo" || !internalRoles.includes(access.role)) {
          return json({ error: "Tu cuenta no puede ejecutar auditorías." }, 403);
        }

        let payload: { domain?: unknown; services?: unknown };
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return json({ error: "Petición no válida." }, 400);
        }

        const domain = typeof payload.domain === "string" ? payload.domain.trim() : "";
        if (!domain) return json({ error: "Falta el dominio que se debe auditar." }, 400);
        const services = Array.isArray(payload.services)
          ? payload.services.filter((s): s is string => typeof s === "string")
          : ["SEO técnico"];

        try {
          const result = await runSeoAudit(domain, services.length ? services : ["SEO técnico"]);
          return json({ ok: true, result, executedBy: access.role });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "No se pudo completar la auditoría.";
          console.error("[auditoría] fallo de ejecución", message);
          return json({ error: message }, 422);
        }
      },
    },
  },
});
