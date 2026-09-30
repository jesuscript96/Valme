"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Layers, List, Plus } from "lucide-react";
import { cx } from "./primitives";

export type ClienteMenu = { slug: string; name: string; status: string };

const iniciales = (nombre: string) =>
  nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");

/**
 * El filtro global del espacio Clientes: el cliente activo, o «Todos los clientes».
 *
 * Plegado muestra solo las iniciales y abre la lista hacia la derecha. Qué pasa al
 * elegir (quedarse en la misma pantalla con otro cliente, o refrescar el filtro de SEO)
 * lo decide quien lo usa, con `onElegir`.
 */
export function SelectorCliente({
  clientes, activo, plegado, puedeCrear, ocupado, onElegir,
}: {
  clientes: ClienteMenu[];
  activo: ClienteMenu | null;
  plegado: boolean;
  puedeCrear: boolean;
  ocupado: boolean;
  onElegir: (slug: string | null) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  const elegir = (slug: string | null) => {
    setAbierto(false);
    if (slug !== (activo?.slug ?? null)) onElegir(slug);
  };

  const opcion = (slug: string | null, nombre: string, alta = false) => {
    const marcada = slug === (activo?.slug ?? null);
    return (
      <button
        key={slug ?? "*"}
        type="button"
        role="option"
        aria-selected={marcada}
        onClick={() => elegir(slug)}
        className={cx(
          "flex w-full items-center gap-2 px-2.5 py-2 text-left text-[13px] hover:bg-os-sunken",
          marcada ? "text-os-text" : "text-os-muted",
        )}
      >
        <Check className={cx("size-3.5 shrink-0", marcada ? "opacity-100" : "opacity-0")} aria-hidden />
        <span className="min-w-0 flex-1 truncate">{nombre}</span>
        {alta ? <span className="text-[10px] uppercase tracking-wide text-os-faint">alta</span> : null}
      </button>
    );
  };

  const nombre = activo?.name ?? "Todos los clientes";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={plegado ? `Cliente activo: ${nombre}` : undefined}
        title={plegado ? nombre : undefined}
        disabled={ocupado}
        className={cx(
          "flex items-center rounded-md border border-os-border bg-os-surface text-left hover:bg-os-sunken disabled:opacity-60",
          plegado ? "size-9 justify-center" : "w-full justify-between gap-2 px-2.5 py-2",
        )}
      >
        {plegado ? (
          activo ? (
            <span className="text-[11px] font-semibold text-os-text">{iniciales(activo.name)}</span>
          ) : (
            <Layers className="size-4 text-os-muted" aria-hidden />
          )
        ) : (
          <>
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-os-faint">Cliente</span>
              <span className="block truncate text-[13px] font-medium text-os-text">{nombre}</span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-os-faint" aria-hidden />
          </>
        )}
      </button>

      {abierto ? (
        <div
          role="listbox"
          aria-label="Elegir cliente"
          className={cx(
            "absolute z-50 max-h-[70dvh] w-60 overflow-y-auto rounded-md border border-os-border bg-os-surface shadow-lg",
            plegado ? "left-full top-0 ml-2" : "left-0 top-full mt-1",
          )}
        >
          {opcion(null, "Todos los clientes")}
          <div className="border-t border-os-border" />
          {clientes.map((c) => opcion(c.slug, c.name, c.status === "onboarding"))}

          <Link
            href="/app/clients"
            onClick={() => setAbierto(false)}
            className="flex items-center gap-2 border-t border-os-border px-2.5 py-2 text-[13px] text-os-muted hover:bg-os-sunken hover:text-os-text"
          >
            <List className="size-3.5" aria-hidden />
            Ver la cartera
          </Link>
          {puedeCrear ? (
            <Link
              href="/app/clients/new"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2 px-2.5 py-2 text-[13px] text-os-muted hover:bg-os-sunken hover:text-os-text"
            >
              <Plus className="size-3.5" aria-hidden />
              Nuevo cliente
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
