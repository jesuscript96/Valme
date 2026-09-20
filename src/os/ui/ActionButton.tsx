"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "./primitives";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Botón que ejecuta una acción de servidor y enseña el error donde ha pasado.
 *
 * El error se pinta al lado del botón, no en un toast que se va solo: cuando una acción
 * falla por una precondición ("aprueba antes el correo"), el mensaje es la instrucción,
 * y hay que poder leerlo con calma.
 */
export function ActionButton({
  action, children, variant = "secondary", size = "md", confirm, disabled, pendingLabel,
}: {
  action: () => Promise<Result>;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  confirm?: string;
  disabled?: boolean;
  pendingLabel?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        variant={variant}
        size={size}
        disabled={disabled || pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError(null);
          start(async () => {
            const r = await action();
            if (!r.ok) setError(r.error);
          });
        }}
      >
        {pending ? (pendingLabel ?? "…") : children}
      </Button>
      {error ? (
        <span role="alert" className="max-w-xs text-right text-[11px] leading-snug text-os-accent">
          {error}
        </span>
      ) : null}
    </span>
  );
}
