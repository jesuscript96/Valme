"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, Monitor, Smartphone } from "lucide-react";
import type { FormField } from "@/os/repo/types";
import { Badge, Card, CardHeader, cx } from "@/os/ui/primitives";
import { ActionButton } from "@/os/ui/ActionButton";
import { publishLanding } from "@/os/repo/mutations";
import {
  BLOCK_LABEL, blockSummary, canHide, readDoc, type LandingDoc,
} from "@/os/domain/landingBlocks";
import { EmptyState } from "@/os/ui/primitives";

type Tab = "bloques" | "correo";

export function LandingEditor({
  landing, offerName, colors, slug,
}: {
  slug: string;
  landing: {
    id: string; slug: string; status: string;
    formFields: FormField[];
    emailTemplate: { subject: string; intro: string; whatsNext: string; signature: string } | null;
    doc: unknown;
  };
  offerName: string;
  colors: { primary: string | null; accent: string | null };
}) {
  const [tab, setTab] = useState<Tab>("bloques");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  // El documento se valida contra el esquema al leerlo: el editor nunca pinta algo que
  // el renderizador no sepa servir.
  const [doc, setDoc] = useState<LandingDoc | null>(() => readDoc(landing.doc));

  function move(i: number, dir: -1 | 1) {
    if (!doc) return;
    const j = i + dir;
    if (j < 0 || j >= doc.blocks.length) return;
    const next = [...doc.blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setDoc({ blocks: next });
  }

  function toggle(i: number) {
    if (!doc || !canHide(doc.blocks[i].block.type)) return;
    setDoc({
      blocks: doc.blocks.map((b, k) => (k === i ? { ...b, visible: !b.visible } : b)),
    });
  }

  if (!doc) {
    return (
      <EmptyState
        title="Esta landing todavía no se ha generado"
        body="Se genera desde la oferta: el LLM rellena los textos con el Brand Kit y la oferta, y los colores, tipografías y logo salen del kit en tiempo de render."
      />
    );
  }

  const heroEntry = doc.blocks.find((b) => b.block.type === "hero");
  const hero = heroEntry?.block.type === "hero" ? heroEntry.block : null;

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
          <ActionButton
            variant="primary"
            size="sm"
            pendingLabel="Publicando…"
            action={() => publishLanding(slug, landing.id)}
          >
            Publicar
          </ActionButton>
        </div>
      </div>

      {tab === "bloques" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card>
            <CardHeader title="Bloques" />
            <ul>
              {doc.blocks.map(({ id, visible, block }, i) => (
                <li
                  key={id}
                  className={cx(
                    "flex items-center gap-3 border-b border-os-border px-3 py-2.5 last:border-0",
                    !visible && "opacity-45",
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
                      disabled={i === doc.blocks.length - 1}
                      aria-label="Bajar"
                      className="text-os-faint hover:text-os-text disabled:opacity-25"
                    >
                      <ChevronDown className="size-3.5" aria-hidden />
                    </button>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-os-text">
                      {BLOCK_LABEL[block.type]}
                    </span>
                    <span className="block truncate text-[12px] text-os-muted">{blockSummary(block)}</span>
                  </span>
                  {canHide(block.type) ? (
                    <button
                      onClick={() => toggle(i)}
                      aria-label={visible ? "Ocultar" : "Mostrar"}
                      className="text-os-faint hover:text-os-text"
                    >
                      {visible ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
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
                    {hero?.headline ?? offerName}
                  </p>
                  <span
                    className="mt-3 inline-block rounded px-3 py-1.5 text-[12px] font-medium text-white"
                    style={{ background: colors.accent ?? "#ff3b21" }}
                  >
                    {hero?.ctaLabel ?? "Enviar"}
                  </span>
                </div>
                {doc.blocks
                  .filter((b) => b.visible && b.block.type !== "hero")
                  .map(({ id, block }) => (
                    <div key={id} className="border-t border-os-border px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wide text-os-faint">
                        {BLOCK_LABEL[block.type]}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-os-text">
                        {blockSummary(block)}
                      </p>
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
