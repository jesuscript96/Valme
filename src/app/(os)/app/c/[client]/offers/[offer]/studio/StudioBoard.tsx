"use client";

import { useState } from "react";
import { Download, KeyRound, RefreshCw, Scissors, Wand2 } from "lucide-react";
import type { AdCreative } from "@/os/repo/types";
import { Badge, Button, Card, cx, EmptyState } from "@/os/ui/primitives";
import { ANGLE_LABEL, CTA_LABEL, CreativeStatusBadge } from "@/os/ui/labels";
import { checkCopy, FIELD_LABEL, type LengthCheck } from "@/os/domain/metaCopy";

/** Contador con el corte visible marcado. Avisa, nunca bloquea. */
function Counter({ c }: { c: LengthCheck }) {
  return (
    <span
      className={cx("os-num text-[11px]", c.over ? "text-os-warn" : "text-os-faint")}
      title={
        c.over
          ? `Meta recomienda ${c.limit}. Por encima se recorta en el feed detrás de "…ver más".`
          : `Recomendado por Meta: ${c.limit}`
      }
    >
      {FIELD_LABEL[c.field]} {c.length}/{c.limit}
    </span>
  );
}

/** Vista previa tipo feed: es donde se ve de verdad dónde cae el corte. */
function FeedPreview({ c, brandName }: { c: AdCreative; brandName: string }) {
  const limit = 125;
  const text = [...c.primaryText];
  const head = text.slice(0, limit).join("");
  const tail = text.slice(limit).join("");

  return (
    <div className="overflow-hidden rounded-md border border-os-border bg-white">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="size-6 rounded-full bg-gradient-to-br from-os-accent to-[#7a2ff0]" />
        <span>
          <span className="block text-[12px] font-semibold leading-tight text-os-text">{brandName}</span>
          <span className="block text-[10px] leading-tight text-os-faint">Publicidad</span>
        </span>
      </div>

      <p className="whitespace-pre-line px-3 pb-2 text-[12px] leading-snug text-os-text">
        {head}
        {tail ? (
          <>
            <span className="bg-os-warn-soft text-os-warn">{tail}</span>
            <span className="ml-1 text-os-faint">…ver más</span>
          </>
        ) : null}
      </p>

      <div className="flex aspect-[4/5] items-center justify-center bg-os-sunken">
        <span className="px-6 text-center text-[11px] leading-relaxed text-os-faint">
          Imagen 4:5 · recortada del máster 3:4
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-os-border px-3 py-2">
        <span className="min-w-0">
          <span className="block truncate text-[11px] font-semibold text-os-text">{c.headline}</span>
          <span className="block truncate text-[10px] text-os-faint">{c.description}</span>
        </span>
        <span className="shrink-0 rounded bg-os-sunken px-2 py-1 text-[10px] font-medium text-os-text">
          {CTA_LABEL[c.cta]}
        </span>
      </div>
    </div>
  );
}

export function StudioBoard({
  creatives, brandName, imageModel, missingKeys, packHref,
}: {
  creatives: AdCreative[];
  brandName: string;
  imageModel: string | null;
  missingKeys: string[];
  packHref: string;
}) {
  const [angleFilter, setAngleFilter] = useState<string>("all");
  const angles = [...new Set(creatives.map((c) => c.angle))];
  const shown = angleFilter === "all" ? creatives : creatives.filter((c) => c.angle === angleFilter);

  if (creatives.length === 0) {
    return (
      <EmptyState
        title="Sin anuncios generados"
        body="Por defecto 3 ángulos × 2 variantes. Cada ángulo es una llamada independiente: regenerar uno no tira los otros."
        action={<Button variant="primary" disabled={missingKeys.length > 0}>Generar 6 anuncios</Button>}
      />
    );
  }

  return (
    <div className="space-y-4">
      {missingKeys.length > 0 ? (
        <Card className="flex items-start gap-3 border-os-warn/30 bg-os-warn-soft p-4">
          <KeyRound className="mt-0.5 size-4 shrink-0 text-os-warn" aria-hidden />
          <div>
            <p className="text-[13px] font-medium text-os-warn">Generación desactivada</p>
            <p className="mt-1 text-[13px] leading-relaxed text-os-warn">
              El tablero muestra datos de demo. Generar de verdad necesita:{" "}
              <span className="font-mono text-[12px]">{missingKeys.join(", ")}</span>
            </p>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          <button
            onClick={() => setAngleFilter("all")}
            className={cx(
              "rounded-md px-2.5 py-1 text-[12px]",
              angleFilter === "all" ? "bg-os-text text-white" : "text-os-muted hover:bg-os-sunken",
            )}
          >
            Todos ({creatives.length})
          </button>
          {angles.map((a) => (
            <button
              key={a}
              onClick={() => setAngleFilter(a)}
              className={cx(
                "rounded-md px-2.5 py-1 text-[12px]",
                angleFilter === a ? "bg-os-text text-white" : "text-os-muted hover:bg-os-sunken",
              )}
            >
              {ANGLE_LABEL[a]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {imageModel ? (
            <Badge tone="info">
              {imageModel === "marketing-studio" ? "Marketing Studio" : "SOUL 2"}
            </Badge>
          ) : null}
          <a href={packHref}>
            <Button size="sm">
              <Download className="size-3.5" aria-hidden />
              Descargar pack
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((c) => {
          const checks = checkCopy(c);
          return (
            <Card key={c.id} className="flex flex-col gap-3 p-3">
              <div className="flex items-center justify-between gap-2">
                <Badge>{ANGLE_LABEL[c.angle]} · v{c.variant}</Badge>
                <CreativeStatusBadge s={c.status} />
              </div>

              <FeedPreview c={c} brandName={brandName} />

              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {checks.map((k) => <Counter key={k.field} c={k} />)}
              </div>

              <div className="flex flex-wrap gap-1.5 border-t border-os-border pt-2.5">
                <Button size="sm" variant="ghost" disabled={missingKeys.length > 0}>
                  <Scissors className="size-3.5" aria-hidden /> Más corto
                </Button>
                <Button size="sm" variant="ghost" disabled={missingKeys.length > 0}>
                  <Wand2 className="size-3.5" aria-hidden /> Más directo
                </Button>
                <Button size="sm" variant="ghost" disabled={missingKeys.length > 0}>
                  <RefreshCw className="size-3.5" aria-hidden /> Regenerar
                </Button>
                {c.status !== "approved" ? (
                  <Button size="sm" variant="primary" className="ml-auto">Aprobar</Button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
