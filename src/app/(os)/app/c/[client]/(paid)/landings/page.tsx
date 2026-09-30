import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { forClient } from "@/os/repo";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/os/ui/primitives";
import { fmtDate } from "@/os/ui/labels";

export const metadata = { title: "Landings · Valme OS" };

/** Pantalla 8 del MD: lista + editor de bloques. */
export default async function LandingsPage({ params }: { params: Promise<{ client: string }> }) {
  const { client: slug } = await params;
  const scope = await forClient(slug);
  const [landings, offers] = await Promise.all([scope.landings.list(), scope.offers.list()]);

  return (
    <>
      <PageHeader
        title="Landings"
        description="Una landing por oferta, generada en un clic y editada por bloques. Publicar es lo único que toca la página viva: mientras editas, lo publicado no cambia."
      />

      {landings.length === 0 ? (
        <EmptyState
          title="Sin landings"
          body="Se generan desde una oferta: el LLM rellena los textos desde el Brand Kit y la oferta, y los colores, tipografías y logo salen del kit en tiempo de render."
          action={
            offers[0] ? (
              <Link href={`/app/c/${slug}/offers/${offers[0].id}`}>
                <Button variant="primary">Ir a las ofertas</Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3">
          {landings.map((l) => {
            const offer = offers.find((o) => o.id === l.offerId);
            const url = `${slug}.valme.site/${l.slug}`;
            return (
              <Card key={l.id} className="flex items-center justify-between gap-6 p-4">
                <div className="min-w-0">
                  <Link
                    href={`/app/c/${slug}/landings/${l.id}`}
                    className="font-display text-[15px] font-semibold text-os-text hover:underline"
                  >
                    {offer?.name ?? l.slug}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[12px] text-os-faint">
                    {url}
                    {l.status === "published" ? <ExternalLink className="size-3" aria-hidden /> : null}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge tone={l.status === "published" ? "ok" : "neutral"}>
                      {l.status === "published" ? "Publicada" : "Borrador"}
                    </Badge>
                    {l.publishedAt ? (
                      <span className="text-[11px] text-os-faint">desde {fmtDate(l.publishedAt)}</span>
                    ) : null}
                    <Badge tone={l.emailTemplate ? "ok" : "warn"}>
                      {l.emailTemplate ? "Correo aprobado" : "Correo sin redactar"}
                    </Badge>
                  </div>
                </div>
                <Link href={`/app/c/${slug}/landings/${l.id}`}>
                  <Button size="sm">Abrir editor</Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
