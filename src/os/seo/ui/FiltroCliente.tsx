"use client";

import { useTransition } from "react";
import { elegirClienteAccion } from "../acciones";

/** Filtro de cliente del módulo. Vale para todas sus pantallas (se guarda en una cookie). */
export function FiltroCliente({
  clientes, actual,
}: { clientes: { slug: string; name: string }[]; actual: string | null }) {
  const [pendiente, empezar] = useTransition();
  return (
    <label className="block rounded-md border border-os-border bg-os-surface px-2.5 py-1.5">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-os-faint">Cliente</span>
      <select
        value={actual ?? ""}
        disabled={pendiente}
        onChange={(e) => {
          const slug = e.target.value;
          empezar(async () => {
            await elegirClienteAccion(slug);
          });
        }}
        className="w-full bg-transparent text-[13px] font-medium text-os-text outline-none"
      >
        <option value="">Todos los clientes</option>
        {clientes.map((c) => (
          <option key={c.slug} value={c.slug}>{c.name}</option>
        ))}
      </select>
    </label>
  );
}
