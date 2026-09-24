import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { logSessionEvent, type MyAccess } from "@/lib/access.functions";
import { ROLE_LABEL, signOutValme } from "@/lib/auth/use-access";

export function SessionBar({ access }: { access: Extract<MyAccess, { allowed: true }> }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const log = useServerFn(logSessionEvent);
  async function out() {
    await qc.cancelQueries();
    await signOutValme(log, () => qc.clear());
    navigate({ to: "/auth", replace: true });
  }
  return (
    <header className="flex h-11 items-center gap-4 border-b border-border bg-background px-4 text-sm text-foreground">
      <Link to="/panel" className="font-mono text-xs tracking-widest">VALME SEARCH OS</Link>
      <span className="ml-auto truncate">{access.fullName || access.email}</span>
      <span className="border border-border px-2 py-0.5 font-mono text-xs">{ROLE_LABEL[access.role]}</span>
      {access.role === "super_admin" && <Link to="/admin" className="underline">Administración</Link>}
      <button onClick={out} className="underline">Cerrar sesión</button>
    </header>
  );
}
