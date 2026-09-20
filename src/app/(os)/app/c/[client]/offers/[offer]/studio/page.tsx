import Link from "next/link";
import { notFound } from "next/navigation";
import { forClient } from "@/os/repo";
import { isConfigured, missingEnv } from "@/os/providers/config";
import { PageHeader } from "@/os/ui/primitives";
import { StudioBoard } from "./StudioBoard";

export const metadata = { title: "Estudio de anuncios · Valme OS" };

/** Pantalla 6 del MD: configurar → tablero de tarjetas con vista previa tipo Instagram. */
export default async function StudioPage({
  params,
}: {
  params: Promise<{ client: string; offer: string }>;
}) {
  const { client: slug, offer: offerId } = await params;
  const scope = await forClient(slug);
  const offer = await scope.offers.get(offerId);
  if (!offer) notFound();

  const [kit, creatives] = await Promise.all([
    scope.brandKit(),
    scope.creatives.listByOffer(offerId),
  ]);

  return (
    <>
      <nav className="mb-3 text-[12px] text-os-faint">
        <Link href={`/app/c/${slug}/offers`} className="hover:underline">Ofertas</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/app/c/${slug}/offers/${offerId}`} className="hover:underline">{offer.name}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-os-muted">Estudio</span>
      </nav>

      <PageHeader
        title="Estudio de anuncios"
        description="Cada tarjeta es un anuncio: copy + imagen + formato. Se generan por ángulo para que puedas descartar un enfoque entero sin tocar los demás."
      />

      <StudioBoard
        creatives={creatives}
        brandName={scope.client.name}
        imageModel={kit.identity.imageModel}
        missingKeys={[
          ...(isConfigured("anthropic") ? [] : missingEnv("anthropic")),
          ...(isConfigured("higgsfield") ? [] : missingEnv("higgsfield")),
        ]}
        packHref={`/api/os/${slug}/offers/${offerId}/pack`}
        slug={slug}
        offerId={offerId}
      />
    </>
  );
}
