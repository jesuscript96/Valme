"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, Monitor, Smartphone } from "lucide-react";
import type { FormField } from "@/os/repo/types";
import { Badge, Button, Card, CardHeader, cx } from "@/os/ui/primitives";
import { BLOCK_LABEL, canHide, emptyDoc, type BlockKind, type LandingDoc } from "@/os/domain/landingBlocks";

type Tab = "bloques" | "correo";

const SAMPLE: { id: string; kind: BlockKind; visible: boolean; preview: string }[] = [
  { id: "b1", kind: "hero", visible: true, preview: "Recupera la mordida sin sorpresas en la factura" },
  { id: "b2", kind: "benefits", visible: true, preview: "Escáner 3D · Plan por escrito · Financiación clara" },
  { id: "b3", kind: "how", visible: true, preview: "3 pasos: visita, plan, tratamiento" },
  { id: "b4", kind: "proof", visible: true, preview: "412 reseñas · 4,8 de media · 18 años en Ruzafa" },
  { id: "b5", kind: "faq", visible: false, preview: "5 preguntas frecuentes" },
  { id: "b6", kind: "form", visible: true, preview: "Nombre, email, teléfono, franja horaria" },
  { id: "b7", kind: "footer", visible: true, preview: "Aviso legal y política de privacidad" },
];

export function LandingEditor({
  landing, offerName, colors,
}: {
  landing: {
    id: string; slug: string; status: string;
    formFields: FormField[];
    emailTemplate: { subject: string; intro: string; whatsNext: string; signature: string } | null;
  };
  offerName: string;
  colors: { primary: string | null; accent: string | null };
}) {
  const [tab, setTab] = useState<Tab>("bloques");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [blocks, setBlocks] = useState(SAMPLE);
  // El documento vive con el esquema real; el editor sólo puede producir formas válidas.
  const [, setDoc] = useState<LandingDoc>(() => emptyDoc(offerName));

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
    setDoc((d) => d);
  }

  function toggle(i: number) {
    if (!canHide(blocks[i].kind)) return;
    setBlocks(blocks.map((b, k) => (k === i ? { ...b, visible: !b.visible } : b)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {(["bloques", "correo"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cx(
                "rounded-md px-3 py-1.5 text-[13px] capitalize",
                tab === t ? "bg-os-text font-medium text-white" : "text-os-muted hover:bg-os-sunken",
              )}
            >
              {t === "correo" ? "Correo de confirmación" : "Bloques"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={landing.status === "published" ? "ok" : "neutral"}>
            {landing.status === "published" ? "Publicada" : "Borrador"}
          </Badge>
          <Button variant="primary" size="sm">Publicar</Button>
        </div>
      </div>

      {tab === "bloques" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card>
            <CardHeader title="Bloques" />
            <ul>
              {blocks.map((b, i) => (
                <li
                  key={b.id}
                  className={cx(
                    "flex items-center gap-3 border-b border-os-border px-3 py-2.5 last:border-0",
                    !b.visible && "opacity-45",
                  )}
                >
                  <span className="flex flex-col">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Subir"
                      className="text-os-faint hover:text-os-text disabled:opacity-25"
                    >
                      <ChevronUp className="size-3.5" aria-hidden />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === blocks.length - 1}
                      aria-label="Bajar"
                      className="text-os-faint hover:text-os-text disabled:opacity-25"
                    >
                      <ChevronDown className="size-3.5" aria-hidden />
                    </button>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-os-text">
                      {BLOCK_LABEL[b.kind]}
                    </span>
                    <span className="block truncate text-[12px] text-os-muted">{b.preview}</span>
                  </span>
                  {canHide(b.kind) ? (
                    <button
                      onClick={() => toggle(i)}
                      aria-label={b.visible ? "Ocultar" : "Mostrar"}
                      className="text-os-faint hover:text-os-text"
                    >
                      {b.visible ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
                    </button>
                  ) : (
                    <span title="El formulario y el pie legal no se pueden ocultar: sin ellos no hay lead ni RGPD.">
                      <Lock className="size-3.5 text-os-faint" aria-hidden />
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="border-t border-os-border px-3 py-2.5 text-[12px] leading-relaxed text-os-muted">
              No se pueden añadir bloques que no estén en esta lista, ni cambiar colores ni
              tipografías: salen del Brand Kit en tiempo de render. Menos libertad, siempre
              on-brand.
            </p>
          </Card>

          <Card className="h-fit">
            <CardHeader
              title="Vista previa"
              action={
                <span className="flex gap-1">
                  {([["mobile", Smartphone], ["desktop", Monitor]] as const).map(([d, Icon]) => (
                    <button
                      key={d}
                      onClick={() => setDevice(d)}
                      aria-label={d}
                      className={cx(
                        "rounded p-1.5",
                        device === d ? "bg-os-sunken text-os-text" : "text-os-faint hover:text-os-text",
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                    </button>
                  ))}
                </span>
              }
            />
            <div className="p-4">
              <div
                className={cx(
                  "mx-auto overflow-hidden rounded-lg border border-os-border bg-white",
                  device === "mobile" ? "w-[300px]" : "w-full",
                )}
              >
                <div className="px-4 py-6" style={{ background: colors.primary ?? "#111" }}>
                  <p className="text-[15px] font-semibold leading-snug text-white">
                    {blocks.find((b) => b.kind === "hero")?.preview}
                  </p>
                  <span
                    className="mt-3 inline-block rounded px-3 py-1.5 text-[12px] font-medium text-white"
                    style={{ background: colors.accent ?? "#ff3b21" }}
                  >
                    Pedir cita
                  </span>
                </div>
                {blocks
                  .filter((b) => b.visible && b.kind !== "hero")
                  .map((b) => (
                    <div key={b.id} className="border-t border-os-border px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wide text-os-faint">
                        {BLOCK_LABEL[b.kind]}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-os-text">{b.preview}</p>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader title="Correo de confirmación" />
          {landing.emailTemplate ? (
            <div className="space-y-4 p-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-os-faint">Asunto</p>
                <p className="mt-0.5 text-[13px] text-os-text">{landing.emailTemplate.subject}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-os-faint">Qué pasa ahora</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-os-text">
                  {landing.emailTemplate.whatsNext}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-os-faint">Firma</p>
                <p className="mt-0.5 text-[13px] text-os-text">{landing.emailTemplate.signature}</p>
              </div>
              <p className="border-t border-os-border pt-3 text-[12px] leading-relaxed text-os-muted">
                Se envía con Resend desde un subdominio verificado del cliente (SPF, DKIM y
                DMARC) para que llegue en su nombre y no a spam. El estado de entrega vuelve
                por webhook y sale como columna en el listado de leads.
              </p>
            </div>
          ) : (
            <p className="px-4 py-10 text-center text-[13px] text-os-muted">
              Sin redactar. Se genera junto con la landing y se aprueba con ella.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
