"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Globe, Sparkles } from "lucide-react";
import { Button, Card, Field, Input } from "@/os/ui/primitives";
import { runExtraction, type WizardState } from "./actions";

const STEPS = [
  { icon: Globe, label: "Leemos la home", detail: "Firecrawl, formato branding: logo, paleta, tipografías" },
  { icon: Sparkles, label: "Buscamos las páginas que importan", detail: "servicios, sobre nosotros, pruebas, legal" },
  { icon: Sparkles, label: "Proponemos mensaje y personas", detail: "Claude Opus 5, con la URL de origen de cada dato" },
];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Extrayendo…" : "Extraer Brand Kit"}
    </Button>
  );
}

export function NewClientWizard() {
  const [state, action] = useActionState<WizardState, FormData>(runExtraction, { phase: "idle" });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="p-5">
        <form action={action} className="space-y-4">
          <Field
            label="Web del cliente"
            htmlFor="url"
            hint="La home. Desde ahí buscamos servicios, sobre nosotros y las páginas legales."
          >
            <Input id="url" name="url" type="url" placeholder="https://ejemplo.es" required />
          </Field>
          <Submit />
        </form>

        {state.phase === "blocked" ? (
          <div className="mt-5 rounded-md border border-os-border bg-os-warn-soft p-4">
            <p className="flex items-center gap-2 text-[13px] font-medium text-os-warn">
              <KeyRound className="size-4" aria-hidden />
              Falta configurar las credenciales
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-os-warn">
              La extracción está implementada, pero necesita estas variables de entorno:
            </p>
            <ul className="mt-2 space-y-0.5">
              {state.missing.map((m) => (
                <li key={m} className="font-mono text-[12px] text-os-warn">{m}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {state.phase === "error" ? (
          <p role="alert" className="mt-5 rounded-md bg-os-accent-soft px-3 py-2 text-[13px] text-os-accent">
            {state.message}
          </p>
        ) : null}

        {state.phase === "done" ? (
          <div className="mt-5 space-y-3">
            <p className="text-[13px] text-os-ok">
              Extraído desde {state.pagesRead.length} páginas · {state.costUsd.toFixed(4)} $
            </p>
            <pre className="max-h-96 overflow-auto rounded-md bg-os-sunken p-3 text-[11px] leading-relaxed">
              {JSON.stringify(
                { identity: state.identity, voice: state.voice, business: state.business, personas: state.personas },
                null,
                2,
              )}
            </pre>
          </div>
        ) : null}
      </Card>

      <Card className="h-fit p-5">
        <p className="mb-3 text-[13px] font-semibold text-os-text">Qué pasa al pulsar</p>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex gap-3">
              <span className="os-num mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-os-sunken text-[11px] font-medium text-os-muted">
                {i + 1}
              </span>
              <span>
                <span className="block text-[13px] text-os-text">{s.label}</span>
                <span className="block text-[12px] leading-relaxed text-os-faint">{s.detail}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t border-os-border pt-3 text-[12px] leading-relaxed text-os-muted">
          Nada de lo extraído se da por bueno: todo entra al Brand Kit marcado como sugerido
          hasta que una persona lo revisa.
        </p>
      </Card>
    </div>
  );
}
