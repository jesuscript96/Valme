import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyAccess } from "@/lib/auth/use-access";
import type { MyAccess } from "@/lib/access.functions";
import { SessionBar } from "./valme-session-bar";

/** Autorización VALME en servidor antes de montar cualquier pantalla interna. */
export function AccessGate({ children }: { children: (a: Extract<MyAccess, { allowed: true }>) => ReactNode }) {
  const q = useMyAccess();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const denied = q.data && !q.data.allowed;
  useEffect(() => {
    if (denied || q.isError) {
      supabase.auth.signOut().then(() => { qc.clear(); navigate({ to: "/auth", search: {}, replace: true, hash: "denied=1" }); });
    }
  }, [denied, q.isError, navigate, qc]);
  if (!q.data || !q.data.allowed) {
    return <main className="flex min-h-screen items-center justify-center bg-background font-mono text-sm text-muted-foreground">Comprobando permisos…</main>;
  }
  return (
    <div className="flex h-screen flex-col bg-background">
      <SessionBar access={q.data} />
      <div className="min-h-0 flex-1">{children(q.data)}</div>
    </div>
  );
}
