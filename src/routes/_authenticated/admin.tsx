import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { AccessGate } from "@/components/valme-access-gate";
import { getAdminData, inviteUser, setClientAccess, updateUser } from "@/lib/admin.functions";
import { ROLE_LABEL } from "@/lib/auth/use-access";
import { DeniedBody } from "@/routes/acceso-denegado";
import { inputCls } from "@/components/valme-auth-shell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administración · VALME Search OS" },
      { name: "description", content: "Gestión de usuarios, roles y accesos a clientes." },
      { property: "og:title", content: "Administración · VALME Search OS" },
      { property: "og:description", content: "Solo Super Admin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AccessGate>
      {(a) => (a.role === "super_admin" ? <Admin selfId={a.userId} /> : <main className="p-8 text-foreground"><h1 className="mb-4 text-xl font-semibold">Acceso denegado</h1><DeniedBody /></main>)}
    </AccessGate>
  ),
});

type Role = "super_admin" | "project_manager" | "equipo" | "cliente";
const ROLES: Role[] = ["super_admin", "project_manager", "equipo", "cliente"];
const btn = "border border-border px-2 py-1 text-xs hover:bg-secondary disabled:opacity-50";

function Admin({ selfId }: { selfId: string }) {
  const qc = useQueryClient();
  const load = useServerFn(getAdminData);
  const invite = useServerFn(inviteUser);
  const update = useServerFn(updateUser);
  const setAccess = useServerFn(setClientAccess);
  const q = useQuery({ queryKey: ["admin"], queryFn: () => load() });
  const [msg, setMsg] = useState<string | null>(null);
  const run = useMutation({
    mutationFn: (f: () => Promise<unknown>) => f(),
    onSuccess: () => { setMsg("Cambio guardado y registrado."); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e) => setMsg(`No se pudo guardar: ${(e as Error).message}`),
  });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("equipo");

  function onInvite(e: FormEvent) {
    e.preventDefault();
    run.mutate(() => invite({ data: { email, fullName: name || undefined, role } }));
    setEmail(""); setName("");
  }

  if (q.isError) return <main className="p-8 text-foreground">No se pudo cargar la administración.</main>;
  if (!q.data) return <main className="p-8 font-mono text-sm text-muted-foreground">Cargando…</main>;
  const { users, clients, assignments, events } = q.data;
  const emailOf = (id: string | null) => users.find((u) => u.user_id === id)?.email ?? "—";

  return (
    <main className="h-full overflow-auto p-6 text-sm text-foreground">
      <h1 className="text-xl font-semibold">Administración</h1>
      <p className="mt-1 text-muted-foreground">Solo por invitación. Google o email sirven para identificarse; el acceso lo decide esta pantalla.</p>
      {msg && <p role="status" className="mt-3 border border-border p-2">{msg}</p>}

      <section className="mt-6 border border-border p-4">
        <h2 className="font-semibold">Invitar usuario</h2>
        <form onSubmit={onInvite} className="mt-3 grid gap-2 sm:grid-cols-4">
          <input required type="email" placeholder="email@empresa.com" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Nombre (opcional)" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
          <button className="bg-primary px-3 py-2 text-primary-foreground" disabled={run.isPending}>Enviar invitación</button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Usuarios</h2>
        <div className="mt-2 space-y-3">
          {users.map((u) => {
            const own = assignments.filter((x) => x.user_id === u.user_id && x.status === "activo").map((x) => x.client_id);
            return (
              <div key={u.user_id} className="border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <strong>{u.full_name || u.email}</strong><span className="text-muted-foreground">{u.email}</span>
                  <span className="border border-border px-2 font-mono text-xs">Estado: {u.status}</span>
                  <select aria-label="Rol" className="border border-input bg-background px-2 py-1 text-xs" value={u.role} disabled={u.user_id === selfId}
                    onChange={(e) => run.mutate(() => update({ data: { userId: u.user_id, role: e.target.value as Role } }))}>
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                  {u.role === "project_manager" && (
                    <label className="text-xs"><input type="checkbox" checked={u.full_portfolio} onChange={(e) => run.mutate(() => update({ data: { userId: u.user_id, fullPortfolio: e.target.checked } }))} /> Toda la cartera</label>
                  )}
                  {u.user_id !== selfId && (
                    <button className={btn} onClick={() => run.mutate(() => update({ data: { userId: u.user_id, status: u.status === "desactivado" ? "activo" : "desactivado" } }))}>
                      {u.status === "desactivado" ? "Reactivar" : "Desactivar"}
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {clients.map((c) => {
                    const has = own.includes(c.id);
                    return (
                      <button key={c.id} className={btn} aria-pressed={has} onClick={() => run.mutate(() => setAccess({ data: { userId: u.user_id, clientId: c.id, grant: !has } }))}>
                        {has ? "Con acceso · " : "Sin acceso · "}{c.nombre}
                      </button>
                    );
                  })}
                  {clients.length === 0 && <span className="text-muted-foreground">Aún no hay clientes en la base de datos.</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Actividad reciente</h2>
        <ul className="mt-2 divide-y divide-border border border-border font-mono text-xs">
          {events.map((ev) => (
            <li key={ev.id} className="p-2">{new Date(ev.created_at).toLocaleString("es-ES")} · {ev.action} · {emailOf(ev.actor_id)}{ev.target_user_id ? ` → ${emailOf(ev.target_user_id)}` : ""}</li>
          ))}
          {events.length === 0 && <li className="p-2">Sin actividad todavía.</li>}
        </ul>
      </section>
    </main>
  );
}
