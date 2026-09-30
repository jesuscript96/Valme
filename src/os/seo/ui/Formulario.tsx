"use client";

import { useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { Button, cx } from "@/os/ui/primitives";
import type { Resultado } from "../tipos";

/**
 * Formulario que llama a una server action y enseña el error al lado del botón.
 *
 * No usa `<form action>` a propósito: React reinicia el formulario tras cada envío y,
 * si la herramienta rechaza la entrada ("escribe el motivo"), se perdería lo escrito.
 * Si va dentro de un `<details>`, lo cierra al terminar bien.
 */
export function Formulario({
  accion, boton, children, variante = "primary", confirmar, className, pendiente = "Guardando…",
}: {
  accion: (datos: FormData) => Promise<Resultado>;
  boton: string;
  children?: ReactNode;
  variante?: "primary" | "secondary" | "danger" | "ghost";
  confirmar?: string;
  className?: string;
  pendiente?: string;
}) {
  const [enCurso, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Hasta que React toma el control, el botón no envía: un envío nativo pondría los
  // campos (notas, motivos) en la URL.
  const listo = useSyncExternalStore(sinSuscripcion, () => true, () => false);

  return (
    <form
      method="post"
      className={cx("space-y-3", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (confirmar && !window.confirm(confirmar)) return;
        const datos = new FormData(form);
        setError(null);
        empezar(async () => {
          const r = await accion(datos);
          if (!r.ok) {
            setError(r.error);
            return;
          }
          form.reset();
          form.closest("details")?.removeAttribute("open");
        });
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant={variante} size="sm" disabled={!listo || enCurso}>
          {enCurso ? pendiente : boton}
        </Button>
        {error ? (
          <span role="alert" className="text-[12px] leading-snug text-os-accent">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}

const sinSuscripcion = () => () => {};

/** Bloque plegable con el aspecto de un botón secundario. Sin estado en el cliente. */
export function Desplegable({
  titulo, children, className,
}: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <details className={cx("group", className)}>
      <summary className="inline-flex h-7 cursor-pointer list-none items-center rounded-md border border-os-border bg-os-surface px-2.5 text-[13px] font-medium text-os-text hover:bg-os-sunken [&::-webkit-details-marker]:hidden">
        {titulo}
      </summary>
      <div className="mt-3 rounded-lg border border-os-border bg-os-sunken/40 p-4">{children}</div>
    </details>
  );
}
