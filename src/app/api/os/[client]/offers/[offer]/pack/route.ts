import { forClient } from "@/os/repo";
import { buildCopyCsv, packFileName } from "@/os/domain/pack";

/**
 * Descarga del pack. De momento sirve el CSV de copys con las URLs ya montadas; las
 * imágenes se añaden al ZIP cuando haya assets generados en Storage (Sprint 2).
 *
 * `forClient` autoriza igual que en cualquier página: un route handler es tan público
 * como una URL, y aquí es donde más fácil sería olvidarlo.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ client: string; offer: string }> },
) {
  const { client: slug, offer: offerId } = await params;
  const scope = await forClient(slug);

  const offer = await scope.offers.get(offerId);
  if (!offer) return new Response("No encontrado", { status: 404 });

  const [creatives, landings] = await Promise.all([
    scope.creatives.listByOffer(offerId),
    scope.landings.list(),
  ]);

  const approved = creatives.filter((c) => c.status === "approved");
  const rows = approved.length > 0 ? approved : creatives;

  const landing = landings.find((l) => l.offerId === offerId && l.status === "published");
  const landingUrl = landing ? `https://${slug}.valme.site/${landing.slug}` : null;

  const csv = buildCopyCsv(rows, landingUrl);
  const name = packFileName(offer.name);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
