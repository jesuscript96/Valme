import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Download } from "lucide-react";
import { forClient } from "@/os/repo";
import { isConfigured } from "@/os/providers/config";
import { buildUrlTags } from "@/os/domain/meta";
import { Badge, Button, Card, CardHeader, Field, Input, PageHeader, Select } from "@/os/ui/primitives";

export const metadata = { title: "Lanzar a Meta · Valme OS" };

/** Pantalla 7 del MD: resumen + "Crear en pausa" o "Descargar pack". */
export default async function LaunchPage({
  params,
}: {
  params: Promise<{ client: string; offer: string }>;
}) {
  const { client: slug, offer: offerId } = await params;
  const scope = await forClient(slug);
  const offer = await scope.offers.get(offerId);
  if (!offer) notFound();

  const [creatives, landings, integrations] = await Promise.all([
    scope.creatives.listByOffer(offerId),
    scope.landings.list(),
    scope.integrations(),
  ]);
  const approved = creatives.filter((c) => c.status === "approved");
  const landing = landings.find((l) => l.offerId === offerId && l.status === "published") ?? null;
  const meta = integrations.find((i) => i.provider === "meta");
  const metaReady = Boolean(meta?.connected) && isConfigured("meta");

  const landingUrl = landing ? `https://${slug}.valme.site/${landing.slug}` : null;
  const sampleUrl = landingUrl
    ? `${landingUrl}?${buildUrlTags(approved[0]?.id ?? "<id>")}`
    : null;

  return (
    <>
      <nav className="mb-3 text-[12px] text-os-faint">
        <Link href={`/app/c/${slug}/offers/${offerId}`} className="hover:underline">{offer.name}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-os-muted">Lanzar</span>
      </nav>

      <PageHeader
        title="Lanzar a Meta"
        description="Se crean campaña, conjunto y anuncios en PAUSA. Valme OS nunca activa nada: eso se hace en Ads Manager, a mano."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title={`Anuncios aprobados (${approved.length})`} />
            {approved.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-os-muted">
                No hay ninguno aprobado todavía.
              </p>
            ) : (
              <ul className="divide-y divide-os-border">
                {approved.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-[13px] text-os-text">{c.headline}</span>
                    <Badge tone="ok">4 formatos</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Configuración de la campaña" />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Objetivo">
                <Select defaultValue="OUTCOME_LEADS" disabled={!metaReady}>
                  <option value="OUTCOME_LEADS">Leads (conversiones en la web)</option>
                  <option value="OUTCOME_TRAFFIC">Tráfico</option>
                </Select>
              </Field>
              <Field label="Presupuesto diario" hint="En euros. Meta lo recibe en céntimos.">
                <Input type="number" min={5} defaultValue={25} disabled={!metaReady} />
              </Field>
              <Field label="Ubicación">
                <Input defaultValue="Valencia (+15 km)" disabled={!metaReady} />
              </Field>
              <Field label="Edad">
                <span className="flex items-center gap-2">
                  <Input type="number" defaultValue={35} disabled={!metaReady} />
                  <span className="text-os-faint">–</span>
                  <Input type="number" defaultValue={60} disabled={!metaReady} />
                </span>
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <p className="mb-3 text-[13px] font-semibold text-os-text">Comprobaciones</p>
            <ul className="space-y-2 text-[13px]">
              {[
                ["Anuncios aprobados", approved.length > 0, `${approved.length}`],
                ["Landing publicada", Boolean(landing), landing ? landing.slug : "pendiente"],
                ["Cuenta de Meta conectada", metaReady, meta?.meta.adAccountId ?? "sin conectar"],
              ].map(([label, ok, detail]) => (
                <li key={label as string} className="flex items-start gap-2">
                  <span className={ok ? "text-os-ok" : "text-os-warn"}>{ok ? "✓" : "○"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-os-text">{label as string}</span>
                    <span className="block truncate text-[11px] text-os-faint">{detail as string}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {sampleUrl ? (
            <Card className="p-4">
              <p className="mb-2 text-[13px] font-semibold text-os-text">URL con UTMs</p>
              <p className="break-all rounded bg-os-sunken p-2 font-mono text-[11px] leading-relaxed text-os-muted">
                {sampleUrl}
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-os-muted">
                <code>utm_content</code> lleva el id interno del anuncio, no el de Meta: así el
                lead sigue atado al anuncio aunque lo renombren en Ads Manager.
              </p>
            </Card>
          ) : null}

          <Button variant="primary" className="w-full" disabled={!metaReady || approved.length === 0}>
            Crear en pausa
          </Button>

          {!metaReady ? (
            <Card className="flex items-start gap-2.5 border-os-warn/30 bg-os-warn-soft p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-os-warn" aria-hidden />
              <p className="text-[12px] leading-relaxed text-os-warn">
                Sin acceso aprobado a la API de Meta, el plan B es el pack descargable. No es un
                apaño: permite que el piloto capte leads reales aunque el Advanced Access de{" "}
                <code>ads_management</code> no haya llegado.
              </p>
            </Card>
          ) : null}

          <a href={`/api/os/${slug}/offers/${offerId}/pack`}>
            <Button className="w-full">
              <Download className="size-3.5" aria-hidden />
              Descargar pack
            </Button>
          </a>
        </div>
      </div>
    </>
  );
}
