"use client";

import { useState, useTransition } from "react";
import { Button, Card, Field, Input, Select, Textarea } from "@/os/ui/primitives";
import { createOffer } from "@/os/repo/mutations";
import { CTA_LABEL } from "@/os/ui/labels";
import type { MetaCta } from "@/os/repo/types";

const CTAS = Object.keys(CTA_LABEL) as MetaCta[];

/** Formulario corto: es la unidad con la que se generan campañas, no un brief. */
export function NewOfferForm({
  slug, personas,
}: {
  slug: string;
  personas: { index: number; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return <Button variant="primary" onClick={() => setOpen(true)}>Nueva oferta</Button>;
  }

  return (
    <Card className="w-full p-4 lg:w-[520px]">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setError(null);
          start(async () => {
            const persona = String(fd.get("persona") ?? "");
            const r = await createOffer(slug, {
              name: String(fd.get("name") ?? ""),
              what: String(fd.get("what") ?? ""),
              hook: String(fd.get("hook") ?? ""),
              cta: String(fd.get("cta") ?? "LEARN_MORE") as MetaCta,
              personaIndex: persona === "" ? null : Number(persona),
            });
            if (r.ok) setOpen(false);
            else setError(r.error);
          });
        }}
      >
        <Field label="Nombre" htmlFor="name">
          <Input id="name" name="name" required placeholder="Primera visita de implantología" />
        </Field>

        <Field label="Qué se ofrece" htmlFor="what" hint="Concreto. Es lo que lee el generador de copys.">
          <Textarea id="what" name="what" required placeholder="Diagnóstico con escáner 3D y plan de tratamiento por escrito, sin compromiso." />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Gancho" htmlFor="hook" hint="Precio, plazo o incentivo. Opcional.">
            <Input id="hook" name="hook" placeholder="Escáner 3D gratis" />
          </Field>
          <Field label="Llamada a la acción" htmlFor="cta">
            <Select id="cta" name="cta" defaultValue="BOOK_NOW">
              {CTAS.map((c) => <option key={c} value={c}>{CTA_LABEL[c]}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Persona objetivo" htmlFor="persona">
          <Select id="persona" name="persona" defaultValue="">
            <option value="">Toda la audiencia</option>
            {personas.map((p) => (
              <option key={p.index} value={p.index}>{p.label}</option>
            ))}
          </Select>
        </Field>

        {error ? (
          <p role="alert" className="rounded-md bg-os-accent-soft px-3 py-2 text-[13px] text-os-accent">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Creando…" : "Crear oferta"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );
}
