"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/os/auth/actions";

export function UserMenu({ name, email, role }: { name: string; email: string; role: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const initials = name.slice(0, 1).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-os-sunken"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-os-text text-[11px] font-semibold text-white">
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] text-os-text">{name}</span>
          <span className="block text-[11px] text-os-faint">{role}</span>
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 mb-1 overflow-hidden rounded-md border border-os-border bg-os-surface shadow-lg"
        >
          <p className="truncate border-b border-os-border px-2.5 py-2 text-[11px] text-os-faint">
            {email}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[13px] text-os-muted hover:bg-os-sunken hover:text-os-text"
            >
              <LogOut className="size-3.5" aria-hidden />
              Cerrar sesión
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
