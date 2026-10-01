"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck, ExternalLink, Sparkles } from "lucide-react";
import type { BrandKit, Sourced } from "@/os/repo/types";
import { Badge, Card, cx, EmptyState } from "@/os/ui/primitives";
import { ActionButton } from "@/os/ui/ActionButton";
import { approveBrandKit } from "@/os/repo/mutations";

const TABS = ["Identidad", "Voz", "Negocio", "Público", "Legal", "Assets"] as const;
type Tab = (typeof TABS)[number];

/** Distingue lo sugerido por IA de lo que ya ha mirado una persona. */
function OriginMark({ origin }: { origin?: string }) {
  if (origin === "reviewed") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-os-ok">
        <CircleCheck className="size-3" aria-hidden /> revisado
      </span>
    );
  }
  if (origin === "empty") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-os-warn">
        <CircleAlert className="size-3" aria-hidden /> no encontrado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-os-faint">
      <Sparkles className="size-3" aria-hidden /> sugerido
    </span>
  );
}

function Row({ label, origin, children }: { label: string; origin?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-4 border-b border-os-border px-4 py-3 last:border-0">
      <div>
        <p className="text-[13px] font-medium text-os-text">{label}</p>
        <OriginMark origin={origin} />
      </div>
      <div className="min-w-0 text-[13px] leading-relaxed text-os-text">{children}</div>
    </div>
  );
}

const Empty = () => <span className="text-os-faint">—</span>;

function SourcedList({ items }: { items: Sourced<string>[] }) {
  if (items.length === 0) return <Empty />;
  return (
    <ul className="space-y-1.5">
      {items.map((s, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="min-w-0 flex-1">{s.value}</span>
          {s.sourceUrl ? (
            <a
              href={s.sourceUrl}
              target="_blank"
              rel="noreferrer"
              title={s.sourceUrl}
              className="mt-0.5 shrink-0 text-os-faint hover:text-os-text"
            >
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : (
            <span title="Sin origen: compruébalo" className="shrink-0 text-[11px] text-os-warn">
              sin origen
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Swatch({ hex, name }: { hex: string | null; name: string }) {
  if (!hex) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-os-border px-1.5 py-1">
      <span className="size-4 rounded-sm border border-black/10" style={{ background: hex }} />
      <span className="text-[11px] text-os-muted">
        {name} <span className="os-num">{hex}</span>
      </span>
    </span>
  );
}

export function BrandKitTabs({
  kit, canApprove, slug,
}: { kit: BrandKit; canApprove: boolean; slug: string }) {
  const [tab, setTab] = useState<Tab>("Identidad");
  const o = kit.origins;

  if (kit.status === "extracting") {
    return (
      <EmptyState
        title="Extrayendo el Brand Kit"
        body="Estamos leyendo la web del cliente: identidad visual con Firecrawl y mensaje con Claude. Tarda menos de un minuto."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div role="tablist" className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cx(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] transition-colors",
                tab === t
                  ? "bg-os-text font-medium text-white"
                  : "text-os-muted hover:bg-os-sunken hover:text-os-text",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {canApprove ? (
          <ActionButton
            variant={kit.status === "approved" ? "secondary" : "primary"}
            disabled={kit.status === "approved"}
            pendingLabel="Aprobando…"
            action={() => approveBrandKit(slug)}
          >
            {kit.status === "approved" ? "Aprobado" : "Aprobar kit"}
          </ActionButton>
        ) : null}
      </div>

      <Card>
        {tab === "Identidad" ? (
          <>
            <Row label="Paleta" origin={o["identity.colors"]}>
              <span className="flex flex-wrap gap-1.5">
                <Swatch hex={kit.identity.colors.primary} name="Primario" />
                <Swatch hex={kit.identity.colors.secondary} name="Secundario" />
                <Swatch hex={kit.identity.colors.accent} name="Acento" />
                {!kit.identity.colors.primary ? <Empty /> : null}
              </span>
            </Row>
            <Row label="Tipografías" origin={o["identity.fonts"]}>
              {kit.identity.fonts.heading ? (
                <>
                  Titulares: <strong className="font-medium">{kit.identity.fonts.heading}</strong> · Texto:{" "}
                  <strong className="font-medium">{kit.identity.fonts.body ?? "—"}</strong>
                </>
              ) : (
                <Empty />
              )}
            </Row>
            <Row label="Estilo fotográfico" origin={o["identity.photoStyle"]}>
              {kit.identity.photoStyle ?? <Empty />}
            </Row>
            <Row label="Modelo de imagen">
              {kit.identity.imageModel === "marketing-studio" ? (
                <>
                  <Badge tone="info">Marketing Studio</Badge>
                  <p className="mt-1.5 text-[12px] text-os-muted">
                    El cliente aporta fotos propias. Es el único endpoint de Higgsfield que
                    acepta imágenes de referencia (<code>image_urls</code>).
                  </p>
                </>
              ) : kit.identity.imageModel === "soul-2" ? (
                <>
                  <Badge tone="neutral">SOUL 2</Badge>
                  <p className="mt-1.5 text-[12px] text-os-muted">
                    Sin fotos del cliente. SOUL es sólo texto-a-imagen: no admite referencias.
                  </p>
                </>
              ) : (
                <Empty />
              )}
            </Row>
          </>
        ) : null}

        {tab === "Voz" ? (
          <>
            <Row label="Tono" origin={o["voice.tone"]}>
              {kit.voice.tone.length ? (
                <span className="flex flex-wrap gap-1.5">
                  {kit.voice.tone.map((t) => <Badge key={t}>{t}</Badge>)}
                </span>
              ) : (
                <Empty />
              )}
            </Row>
            <Row label="Tratamiento">
              {kit.voice.address === "tu" ? "Tuteo" : kit.voice.address === "usted" ? "De usted" : <Empty />}
            </Row>
            <Row label="Palabras a usar">
              {kit.voice.wordsToUse.length ? kit.voice.wordsToUse.join(" · ") : <Empty />}
            </Row>
            <Row label="Palabras a evitar">
              {kit.voice.wordsToAvoid.length ? kit.voice.wordsToAvoid.join(" · ") : <Empty />}
            </Row>
            <Row label="Copy de referencia">
              {kit.voice.sampleCopy.length ? (
                <ul className="space-y-1">
                  {kit.voice.sampleCopy.map((s, i) => (
                    <li key={i} className="border-l-2 border-os-border pl-2 italic">{s}</li>
                  ))}
                </ul>
              ) : (
                <Empty />
              )}
            </Row>
          </>
        ) : null}

        {tab === "Negocio" ? (
          <>
            <Row label="Propuesta de valor" origin={o["business.valueProposition"]}>
              {kit.business.valueProposition ? (
                <SourcedList items={[kit.business.valueProposition]} />
              ) : (
                <Empty />
              )}
            </Row>
            <Row label="Servicios"><SourcedList items={kit.business.services} /></Row>
            <Row label="Diferenciales"><SourcedList items={kit.business.differentiators} /></Row>
            <Row label="Pruebas" origin={o["business.proof"]}>
              {kit.business.proof.length ? (
                <SourcedList items={kit.business.proof} />
              ) : (
                <span className="text-os-warn">
                  No hemos encontrado ninguna prueba verificable en la web. No inventamos
                  cifras ni testimonios: si las hay, añádelas tú.
                </span>
              )}
            </Row>
            <Row label="Zona">{kit.business.geo ?? <Empty />}</Row>
          </>
        ) : null}

        {tab === "Público" ? (
          kit.personas.length === 0 ? (
            <div className="p-4"><Empty /></div>
          ) : (
            kit.personas.map((p, i) => (
              <Row key={i} label={`Persona ${i + 1}`} origin={o.personas}>
                <p className="font-medium">{p.profile}</p>
                <dl className="mt-2 grid gap-2 sm:grid-cols-3">
                  {([["Dolores", p.pains], ["Deseos", p.desires], ["Objeciones", p.objections]] as const).map(
                    ([label, items]) => (
                      <div key={label}>
                        <dt className="text-[11px] uppercase tracking-wide text-os-faint">{label}</dt>
                        <dd className="mt-0.5 space-y-0.5 text-[12px] text-os-muted">
                          {items.map((x, j) => <p key={j}>{x}</p>)}
                        </dd>
                      </div>
                    ),
                  )}
                </dl>
              </Row>
            ))
          )
        ) : null}

        {tab === "Legal" ? (
          <>
            <Row label="Responsable">{kit.legal.controller ?? <Empty />}</Row>
            <Row label="Política de privacidad">
              {kit.legal.privacyUrl ? (
                <a href={kit.legal.privacyUrl} target="_blank" rel="noreferrer" className="underline">
                  {kit.legal.privacyUrl}
                </a>
              ) : (
                <Empty />
              )}
            </Row>
            <Row label="Texto de consentimiento" origin={o["legal.consentText"]}>
              {kit.legal.consentText ?? <Empty />}
            </Row>
            <Row label="Base legal de la CAPI">
              <Badge tone={kit.legal.capiLegalBasis === "consent" ? "ok" : "warn"}>
                {kit.legal.capiLegalBasis === "consent" ? "Sólo con consentimiento" : "Interés legítimo"}
              </Badge>
              <p className="mt-1.5 text-[12px] leading-relaxed text-os-muted">
                Enviar el evento a Meta sin consentimiento es una postura que firma el cliente,
                no un ajuste por defecto. Se cambia en Integraciones, marcándolo a propósito.
              </p>
            </Row>
          </>
        ) : null}

        {tab === "Assets" ? (
          <div className="p-4">
            <EmptyState
              title="Sin assets subidos"
              body="Fotos de producto, equipo o local. Si las hay, el generador de imágenes usa Marketing Studio con ellas como referencia en vez de SOUL."
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
