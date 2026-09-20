import Link from "next/link";
import { notFound } from "next/navigation";
import { forClient } from "@/os/repo";
import { Badge, Button, Card, CardHeader, PageHeader } from "@/os/ui/primitives";
import { CTA_LABEL, fmtEurCents } from "@/os/ui/labels";

export default async function OfferDetail({
  params,
}: {
  params: Promise<{ client: string; offer: string }>;
}) {
  const { client: slug, offer: offerId } = await params;
  const scope = await forClient(slug);
  const offer = await scope.offers.get(offerId);
  if (!offer) notFound();

  const [creatives, campaigns, landings] = await Promise.all([
    scope.creatives.listByOffer(offerId),
    scope.campaigns.listByOffer(offerId),
    scope.landings.list(),
  ]);
  const landing = landings.find((l) => l.offerId === offerId) ?? null;
  const approved = creatives.filter((c) => c.status === "approved");
  const base = `/app/c/${slug}/offers/${offerId}`;

  const steps = [
    {
      n: 1, title: "Creatividades",
      state: creatives.length === 0 ? "Sin generar" : `${approved.length} de ${creatives.length} aprobados`,
      href: `${base}/studio`, cta: creatives.length ? "Abrir estudio" : "Generar anuncios",
      blocked: null as string | null,
    },
    {
      n: 2, title: "Landing",
      state: landing ? (landing.status === "published" ? "Publicada" : "Borrador") : "Sin generar",
      href: landing ? `/app/c/${slug}/landings/${landing.id}` : `/app/c/${slug}/landings`,
      cta: landing ? "Abrir editor" : "Generar landing",
      blocked: null,
    },
    {
      n: 3, title: "Campaña",
      state: campaigns[0] ? "Creada en pausa" : "Sin crear",
      href: `${base}/launch`, cta: "Lanzar a Meta",
      blocked:
        approved.length === 0
          ? "Aprueba al menos un anuncio"
          : !landing || landing.status !== "published"
            ? "Publica antes la landing"
            : null,
    },
  ];

  return (
    <>
      <nav className="mb-3 text-[12px] text-os-faint">
        <Link href={`/app/c/${slug}/offers`} className="hover:underline">Ofertas</Link>
        <span className="mx-1.5">/</span>
        <span className="text-os-muted">{offer.name}</span>
      </nav>

      <PageHeader
        title={offer.name}
        description={offer.what}
        action={
          <span className="flex gap-1.5">
            {offer.hook ? <Badge tone="accent">{offer.hook}</Badge> : null}
            <Badge>{CTA_LABEL[offer.cta]}</Badge>
          </span>
        }
      />

      <div className="grid gap-3">
        {steps.map((s) => (
          <Card key={s.n} className="flex items-center gap-4 p-4">
            <span className="os-num flex size-7 shrink-0 items-center justify-center rounded-full bg-os-sunken text-[12px] font-semibold text-os-muted">
              {s.n}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-os-text">{s.title}</span>
              <span className="block text-[12px] text-os-muted">{s.state}</span>
            </span>
            {s.blocked ? (
              <span className="text-[12px] text-os-faint">{s.blocked}</span>
            ) : (
              <Link href={s.href}>
                <Button size="sm">{s.cta}</Button>
              </Link>
            )}
          </Card>
        ))}
      </div>

      {campaigns[0] ? (
        <Card className="mt-6">
          <CardHeader title="Campaña en Meta" />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-[13px] sm:grid-cols-4">
            {[
              ["Objetivo", campaigns[0].objective],
              ["Presupuesto diario", fmtEurCents(campaigns[0].dailyBudgetCents)],
              ["Ubicación", campaigns[0].geo],
              ["Edad", `${campaigns[0].ageMin}–${campaigns[0].ageMax}`],
              ["ID de campaña", campaigns[0].metaCampaignId ?? "—"],
              ["ID de conjunto", campaigns[0].metaAdsetId ?? "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] uppercase tracking-wide text-os-faint">{k}</dt>
                <dd className="os-num mt-0.5 text-os-text">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-os-border px-4 py-2.5 text-[12px] text-os-muted">
            Creada en pausa. Valme OS nunca activa una campaña: eso se hace en Ads Manager,
            a mano y a propósito.
          </p>
        </Card>
      ) : null}
    </>
  );
}
