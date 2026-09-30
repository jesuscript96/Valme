import type { ReactNode } from "react";
import { MenuPrincipal } from "./MenuPrincipal";
import { Nav, type NavItem } from "./Nav";
import type { ClienteMenu } from "./SelectorCliente";
import { ROLE_LABEL } from "@/os/data/members";
import type { Role } from "@/os/auth/session";

/**
 * MARCO DEL ÁREA. Lo pinta una sola vez `src/app/(os)/app/layout.tsx`: el menú principal
 * a la izquierda y, al lado, lo que ponga cada área — su menú secundario (`MenuArea`) o
 * directamente el contenido (`Contenido`).
 */
export function Shell({
  user, clients, activo, children,
}: {
  user: { name: string; email: string; role: Role };
  clients: ClienteMenu[];
  /** El último cliente elegido (cookie), ya comprobado contra los visibles. */
  activo: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <MenuPrincipal
        user={{ name: user.name, email: user.email, role: ROLE_LABEL[user.role], isAdmin: user.role === "admin" }}
        clientes={clients}
        activoInicial={activo}
      />
      <div className="flex min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** La columna de contenido. Las áreas sin menú propio la usan directamente. */
export function Contenido({ children }: { children: ReactNode }) {
  return (
    <main className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
  );
}

/**
 * Menú secundario de un área (Paid, SEO…), con su título y el ámbito debajo. En pantallas
 * estrechas no hay columna: las entradas pasan a una fila encima del contenido.
 */
export function MenuArea({
  titulo, ambito, nav, children,
}: {
  titulo: string;
  /** Sobre qué se está trabajando: el cliente, o «Todos los clientes». */
  ambito?: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-3 border-r border-os-border bg-os-bg px-3 py-4 md:flex">
        <div className="px-2.5 pt-1">
          <p className="font-display text-[15px] font-semibold tracking-tight text-os-text">{titulo}</p>
          {ambito ? <p className="mt-0.5 truncate text-[12px] text-os-faint">{ambito}</p> : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Nav items={nav} />
        </div>
      </aside>
      <Contenido>
        <div className="mb-5 md:hidden">
          <Nav items={nav} horizontal />
        </div>
        {children}
      </Contenido>
    </>
  );
}
