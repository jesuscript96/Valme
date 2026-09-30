import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "./primitives";

/** Piezas de las pantallas de Inicio: cifras rápidas y accesos directos. */

export function Cifras({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}

export function Cifra({
  etiqueta, valor, nota, href,
}: { etiqueta: string; valor: string; nota?: string; href?: string }) {
  const cuerpo = (
    <>
      <p className="text-[11px] uppercase tracking-wide text-os-faint">{etiqueta}</p>
      <p className="os-num mt-1 font-display text-xl font-semibold text-os-text">{valor}</p>
      {nota ? <p className="mt-0.5 text-[12px] text-os-muted">{nota}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="rounded-lg border border-os-border bg-os-surface px-4 py-3 transition-colors hover:border-os-border-strong">
      {cuerpo}
    </Link>
  ) : (
    <Card className="px-4 py-3">{cuerpo}</Card>
  );
}

export type Atajo = { href: string; titulo: string; detalle: string; area: string };

export function Atajos({ atajos }: { atajos: Atajo[] }) {
  return (
    <section aria-label="Accesos directos" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {atajos.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="group rounded-lg border border-os-border bg-os-surface px-4 py-3 transition-colors hover:border-os-border-strong hover:bg-os-sunken/40"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-os-faint">{a.area}</span>
            <ArrowUpRight className="size-3.5 text-os-faint transition-colors group-hover:text-os-accent" aria-hidden />
          </span>
          <span className="mt-1 block text-[13px] font-medium text-os-text">{a.titulo}</span>
          <span className="block text-[12px] text-os-muted">{a.detalle}</span>
        </Link>
      ))}
    </section>
  );
}
