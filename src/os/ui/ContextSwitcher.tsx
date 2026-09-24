"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./primitives";

/**
 * Conmutador entre las dos mitades de la aplicación.
 *
 * Va arriba del todo y no dentro de la navegación lateral, porque no son dos secciones:
 * son dos contextos con datos distintos y permisos distintos. En Diagnóstico los datos
 * son de Valme; en Cuentas, del cliente.
 */
export function ContextSwitcher() {
  const pathname = usePathname();
  const enDx = pathname.startsWith("/app/dx");

  const items = [
    { href: "/app/dx", label: "Diagnóstico", activo: enDx },
    { href: "/app/clients", label: "Cuentas", activo: !enDx },
  ];

  return (
    <div className="flex gap-0.5 rounded-md bg-os-sunken p-0.5" role="tablist">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          role="tab"
          aria-selected={i.activo}
          className={cx(
            "flex-1 rounded px-2 py-1 text-center text-[12px] font-medium transition-colors",
            i.activo
              ? "bg-os-surface text-os-text shadow-sm"
              : "text-os-muted hover:text-os-text",
          )}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}
