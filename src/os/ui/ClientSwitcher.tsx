"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { cx } from "./primitives";

export type SwitcherClient = { slug: string; name: string; status: string };

/**
 * El "filtro global" del área.
 *
 * Cambiar de cliente reescribe SÓLO el segmento del slug en la ruta actual, así que
 * te quedas en la misma pantalla con los datos del otro cliente: estás en Leads de
 * Nordic, cambias, y sigues en Leads de Rivas. Eso es lo que hace que el área se sienta
 * filtrada a nivel global en vez de ser nueve pantallas sueltas.
 */
export function ClientSwitcher({
  clients,
  current,
  canCreate,
}: {
  clients: SwitcherClient[];
  current: SwitcherClient;
  canCreate: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchTo(slug: string) {
    setOpen(false);
    if (slug === current.slug) return;
    // `/app/c/<actual>/leads` → `/app/c/<nuevo>/leads`
    const next = pathname.startsWith(`/app/c/${current.slug}`)
      ? pathname.replace(`/app/c/${current.slug}`, `/app/c/${slug}`)
      : `/app/c/${slug}`;
    router.push(next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-os-border bg-os-surface px-2.5 py-2 text-left hover:bg-os-sunken"
      >
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-os-text">{current.name}</span>
          <span className="block text-[11px] text-os-faint">Cliente activo</span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-os-faint" aria-hidden />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-os-border bg-os-surface shadow-lg"
        >
          {clients.map((c) => (
            <button
              key={c.slug}
              type="button"
              role="option"
              aria-selected={c.slug === current.slug}
              onClick={() => switchTo(c.slug)}
              className={cx(
                "flex w-full items-center gap-2 px-2.5 py-2 text-left text-[13px] hover:bg-os-sunken",
                c.slug === current.slug ? "text-os-text" : "text-os-muted",
              )}
            >
              <Check
                className={cx("size-3.5 shrink-0", c.slug === current.slug ? "opacity-100" : "opacity-0")}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              {c.status === "onboarding" ? (
                <span className="text-[10px] uppercase tracking-wide text-os-faint">alta</span>
              ) : null}
            </button>
          ))}

          {canCreate ? (
            <Link
              href="/app/clients/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 border-t border-os-border px-2.5 py-2 text-[13px] text-os-muted hover:bg-os-sunken hover:text-os-text"
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
