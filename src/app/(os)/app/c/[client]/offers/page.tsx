import Link from "next/link";
import { forClient } from "@/os/repo";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/os/ui/primitives";
import { CTA_LABEL, fmtDate } from "@/os/ui/labels";
import { NewOfferForm } from "./NewOfferForm";

export const metadata = { title: "Ofertas · Valme OS" };

/** Pantalla 5 del MD. La oferta es la unidad que une creatividades, landing y campaña. */
export default async function OffersPage({ params }: { params: Promise<{ client: string }> }) {
  const { client: slug } = await params;
  const scope = await forClient(slug);
  const [kit, offers] = await Promise.all([scope.brandKit(), scope.offers.list()]);
  const personaOptions = kit.personas.map((p, index) => ({
    index,
    label: p.profile.length > 60 ? `${p.profile.slice(0, 60)}…` : p.profile,
  }));

  if (kit.status !== "approved") {
    return (
      <>
        <PageHeader title="Ofertas" />
        <EmptyState
          title="Primero hay que aprobar el Brand Kit"
          body="Cada oferta genera sus copys, su landing y su campaña leyendo del kit. Con un kit sin revisar, todo lo que salga arrastra los errores."
          action={
            <Link href={`/app/c/${slug}/brand-kit`}>
              <Button variant="primary">Ir al Brand Kit</Button>
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Ofertas"
        description="Un Brand Kit tiene varias ofertas. Cada una genera sus creatividades, su landing y su campaña — y así cada lead queda atado a su origen sin trabajo manual."
        action={<NewOfferForm slug={slug} personas={personaOptions} />}
      />

      {offers.length === 0 ? (
        <EmptyState
          title="Sin ofertas todavía"
          body="Una oferta es qué se vende, a quién y con qué gancho. Es lo mínimo que necesita el generador para escribir algo que no sea genérico."
          action={<NewOfferForm slug={slug} personas={personaOptions} />}
        />
      ) : (
        <div className="grid gap-3">
          {offers.map((o) => (
            <Card key={o.id} className="flex items-start justify-between gap-6 p-4">
              <div className="min-w-0">
                <Link
                  href={`/app/c/${slug}/offers/${o.id}`}
                  className="font-display text-[15px] font-semibold text-os-text hover:underline"
                >
                  {o.name}
                </Link>
                <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-os-muted">{o.what}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {o.hook ? <Badge tone="accent">{o.hook}</Badge> : null}
                  <Badge>{CTA_LABEL[o.cta]}</Badge>
                  {o.personaIndex !== null && kit.personas[o.personaIndex] ? (
                    <Badge tone="info">{kit.personas[o.personaIndex].profile.slice(0, 44)}…</Badge>
                  ) : null}
                  {o.endsAt ? <Badge tone="warn">Hasta {fmtDate(o.endsAt)}</Badge> : null}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/app/c/${slug}/offers/${o.id}/studio`}>
                  <Button size="sm">Estudio de anuncios</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
