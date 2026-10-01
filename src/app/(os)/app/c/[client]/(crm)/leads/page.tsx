import Link from "next/link";
import { Download } from "lucide-react";
import { forClient } from "@/os/repo";
import { Badge, Button, EmptyState, PageHeader, Table, Td, Th } from "@/os/ui/primitives";
import { ANGLE_LABEL, EmailStatusBadge, fmtDateTime } from "@/os/ui/labels";
import { LeadFilters } from "./LeadFilters";

export const metadata = { title: "Leads · Valme OS" };

/** Pantalla 9 del MD: tabla con filtros, exportación CSV y ficha de solo lectura. */
export default async function LeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ client: string }>;
  searchParams: Promise<{ offer?: string; q?: string }>;
}) {
  const { client: slug } = await params;
  const { offer, q } = await searchParams;
  const scope = await forClient(slug);

  const [offers, leads, creatives] = await Promise.all([
    scope.offers.list(),
    scope.leads.list({ offerId: offer, q }),
    Promise.all((await scope.offers.list()).map((o) => scope.creatives.listByOffer(o.id))).then((r) => r.flat()),
  ]);

  const creativeById = new Map(creatives.map((c) => [c.id, c]));

  return (
    <>
      <PageHeader
        title="Leads"
        description="Sin pipeline: ver y exportar lo que entra. Cada lead llega atado a su oferta, su campaña y su anuncio por las UTMs."
        action={
          <a href={`/api/os/${slug}/leads/export${offer ? `?offer=${offer}` : ""}`}>
            <Button>
              <Download className="size-3.5" aria-hidden />
              Exportar CSV
            </Button>
          </a>
        }
      />

      <LeadFilters offers={offers.map((o) => ({ id: o.id, name: o.name }))} />

      {leads.length === 0 ? (
        <EmptyState
          title="Sin leads con estos filtros"
          body="Cuando la landing esté publicada y la campaña activa en Ads Manager, los leads entran aquí en segundos con el anuncio que los trajo."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Fecha</Th>
              <Th>Nombre</Th>
              <Th>Contacto</Th>
              <Th>Anuncio</Th>
              <Th>Correo</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => {
              const c = l.adCreativeId ? creativeById.get(l.adCreativeId) : null;
              return (
                <tr key={l.id} className="hover:bg-os-sunken">
                  <Td className="os-num whitespace-nowrap text-os-muted">{fmtDateTime(l.createdAt)}</Td>
                  <Td className="font-medium">{l.name}</Td>
                  <Td>
                    <span className="block text-[12px]">{l.email}</span>
                    <span className="os-num block text-[12px] text-os-faint">{l.phone}</span>
                  </Td>
                  <Td>
                    {c ? (
                      <span className="flex items-center gap-2">
                        <span className="size-7 shrink-0 rounded bg-gradient-to-br from-os-sunken to-os-border" />
                        <span className="min-w-0">
                          <span className="block truncate text-[12px]">{c.headline}</span>
                          <Badge>{ANGLE_LABEL[c.angle]}</Badge>
                        </span>
                      </span>
                    ) : (
                      <span className="text-[12px] text-os-faint">Directo</span>
                    )}
                  </Td>
                  <Td><EmailStatusBadge s={l.emailStatus} /></Td>
                  <Td className="text-right">
                    <Link
                      href={`/app/c/${slug}/leads/${l.id}`}
                      className="text-[12px] text-os-muted hover:text-os-text hover:underline"
                    >
                      Ver ficha
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
