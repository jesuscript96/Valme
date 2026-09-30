"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChevronsUpDown } from "lucide-react";
import { MODULOS, moduloDe } from "./modulos";
import { cx } from "./primitives";

/**
 * Selector de módulo.
 *
 * Va arriba del todo y no dentro de la navegación lateral, porque no son secciones: son
 * espacios con datos, menú y permisos propios. Cuentas es del cliente, Diagnóstico es de
 * Valme y SEO · GEO · AEO reúne todo lo de buscadores y asistentes.
 */
export function ContextSwitcher() {
  const pathname = usePathname();
  const actual = moduloDe(pathname);
  const ref = useRef<HTMLDetailsElement>(null);

  // Al cambiar de ruta se cierra el desplegable.
  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);

  return (
    <details ref={ref} className="relative">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md border border-os-border bg-os-surface px-2.5 py-2 hover:bg-os-sunken [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-os-faint">Módulo</span>
          <span className="block truncate text-[13px] font-medium text-os-text">{actual.nombre}</span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-os-faint" aria-hidden />
      </summary>
      <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border border-os-border bg-os-surface shadow-lg">
        {MODULOS.map((m) => (
          <Link
            key={m.clave}
            href={m.href}
            aria-current={m.clave === actual.clave ? "page" : undefined}
            className={cx(
              "block px-3 py-2 hover:bg-os-sunken",
              m.clave === actual.clave && "bg-os-sunken",
            )}
          >
            <span className="block text-[13px] font-medium text-os-text">{m.nombre}</span>
            <span className="block text-[11px] text-os-muted">{m.descripcion}</span>
          </Link>
        ))}
      </div>
    </details>
  );
}
