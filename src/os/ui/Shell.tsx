import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { ClientSwitcher, type SwitcherClient } from "./ClientSwitcher";
import { ContextSwitcher } from "./ContextSwitcher";
import { Nav, type NavItem } from "./Nav";
import { UserMenu } from "./UserMenu";
import { ROLE_LABEL } from "@/os/data/members";
import type { Role } from "@/os/auth/session";

/**
 * Marco del área: barra lateral fija con el selector de cliente arriba y el menú de
 * usuario abajo. Lo pintan los layouts de `/app/clients` y `/app/c/[client]`, que son
 * los dos únicos sitios donde se sabe si hay cliente activo o no.
 */
export function Shell({
  user, clients, current, nav, children, contexto = "cuentas",
}: {
  user: { name: string; email: string; role: Role };
  clients: SwitcherClient[];
  current: SwitcherClient | null;
  nav: NavItem[];
  children: ReactNode;
  /** Qué mitad de la aplicación se está mirando. */
  contexto?: "dx" | "cuentas";
}) {
  const isAdmin = user.role === "admin";

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col gap-4 border-r border-os-border bg-os-surface px-3 py-4">
        <Link href="/app" className="px-1 font-display text-[15px] font-semibold tracking-tight text-os-text">
          Valme <span className="text-os-accent">OS</span>
        </Link>

        <ContextSwitcher />

        {contexto === "dx" ? null : current ? (
          <ClientSwitcher clients={clients} current={current} canCreate={isAdmin} />
        ) : (
          <p className="rounded-md border border-dashed border-os-border px-2.5 py-2 text-[11px] text-os-faint">
            Sin cliente activo
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Nav items={nav} />
        </div>

        {contexto === "cuentas" && current ? (
          <Link
            href="/app/clients"
            className="flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-os-muted hover:text-os-text"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Todos los clientes
          </Link>
        ) : null}

        <div className="border-t border-os-border pt-2">
          <UserMenu name={user.name} email={user.email} role={ROLE_LABEL[user.role]} />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-8 py-7">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

/** Navegación de un cliente. Lo que no se puede hacer aún sale bloqueado y dice por qué. */
export function clientNav(
  slug: string,
  state: { kitApproved: boolean; offerCount: number; leadCount: number; isAdmin: boolean },
): NavItem[] {
  const base = `/app/c/${slug}`;
  const needsKit = state.kitApproved ? undefined : "Aprueba antes el Brand Kit";

  const items: NavItem[] = [
    { href: base, label: "Resumen", icon: "home" },
    { href: `${base}/brand-kit`, label: "Brand Kit", icon: "kit" },
    {
      href: `${base}/offers`, label: "Ofertas", icon: "offers",
      blockedBecause: needsKit,
      badge: state.offerCount ? String(state.offerCount) : undefined,
    },
    {
      href: `${base}/landings`, label: "Landings", icon: "landings",
      blockedBecause: state.offerCount ? undefined : "Crea antes una oferta",
    },
    {
      href: `${base}/leads`, label: "Leads", icon: "leads",
      badge: state.leadCount ? String(state.leadCount) : undefined,
    },
  ];

  if (state.isAdmin) {
    items.push({ href: `${base}/settings`, label: "Integraciones", icon: "settings" });
  }
  return items;
}
