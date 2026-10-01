import Link from "next/link";
import { notFound } from "next/navigation";
import { forClient } from "@/os/repo";
import { Card, CardHeader, PageHeader } from "@/os/ui/primitives";
import { ANGLE_LABEL, EmailStatusBadge, fmtDateTime } from "@/os/ui/labels";

/** Ficha de SOLO LECTURA. No hay pipeline en el MVP: nada aquí se edita. */
export default async function LeadDetail({
  params,
}: {
  params: Promise<{ client: string; lead: string }>;
}) {
  const { client: slug, lead: leadId } = await params;
  const scope = await forClient(slug);
  const lead = await scope.leads.get(leadId);
  if (!lead) notFound();

  const offers = await scope.offers.list();
  const creatives = (
    await Promise.all(offers.map((o) => scope.creatives.listByOffer(o.id)))
  ).flat();
  const creative = creatives.find((c) => c.id === lead.adCreativeId) ?? null;

  const sections: [string, [string, string | null][]][] = [
    ["Contacto", [
      ["Nombre", lead.name], ["Email", lead.email], ["Teléfono", lead.phone],
      ["Recibido", fmtDateTime(lead.createdAt)],
    ]],
    ["Respuestas", Object.entries(lead.answers).map(([k, v]) => [k, v] as [string, string])],
    ["Origen", [
      ["utm_source", lead.utm.source], ["utm_medium", lead.utm.medium],
      ["utm_campaign", lead.utm.campaign], ["utm_content", lead.utm.content],
      ["fbclid", lead.fbclid],
    ]],
    ["Deduplicación y medición", [
      ["event_id", lead.eventId],
    ]],
  ];

  return (
    <>
      <nav className="mb-3 text-[12px] text-os-faint">
        <Link href={`/app/c/${slug}/leads`} className="hover:underline">Leads</Link>
        <span className="mx-1.5">/</span>
        <span className="text-os-muted">{lead.name}</span>
      </nav>

      <PageHeader title={lead.name ?? "Lead"} action={<EmailStatusBadge s={lead.emailStatus} />} />

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map(([title, rows]) => (
          <Card key={title}>
            <CardHeader title={title} />
            <dl className="divide-y divide-os-border">
              {rows.length === 0 ? (
                <p className="px-4 py-3 text-[13px] text-os-faint">—</p>
              ) : (
                rows.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 px-4 py-2.5">
                    <dt className="text-[12px] text-os-faint">{k}</dt>
                    <dd className="os-num min-w-0 break-words text-[13px] text-os-text">{v ?? "—"}</dd>
                  </div>
                ))
              )}
            </dl>
          </Card>
        ))}

        <Card>
          <CardHeader title="Consentimiento" />
          <div className="space-y-2 p-4">
            <p className="text-[13px] text-os-text">
              {lead.consent ? "Aceptado" : "No aceptado"}
            </p>
            <p className="rounded bg-os-sunken p-3 text-[12px] leading-relaxed text-os-muted">
              {lead.consentText ?? "—"}
            </p>
            <p className="text-[12px] leading-relaxed text-os-muted">
              Se guarda el texto literal que aceptó esta persona, no una referencia: el texto
              cambia con el tiempo y hay que poder probar qué firmó cada uno.
            </p>
          </div>
        </Card>

        {creative ? (
          <Card>
            <CardHeader title="Anuncio que lo trajo" />
            <div className="space-y-2 p-4">
              <p className="text-[13px] font-medium text-os-text">{creative.headline}</p>
              <p className="text-[12px] text-os-muted">{ANGLE_LABEL[creative.angle]} · v{creative.variant}</p>
              <p className="whitespace-pre-line rounded bg-os-sunken p-3 text-[12px] leading-relaxed text-os-muted">
                {creative.primaryText}
              </p>
            </div>
          </Card>
        ) : null}
      </div>
    </>
  );
}
