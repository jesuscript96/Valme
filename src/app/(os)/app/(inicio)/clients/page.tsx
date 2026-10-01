import Link from "next/link";
import type { Metadata } from "next";
import { requireMember } from "@/os/auth/dal";
import { clientSummaries } from "@/os/repo";
import { Button, EmptyState, PageHeader, Table, Td, Th } from "@/os/ui/primitives";
import { ClientStatusBadge, KitStatus, fmtUsd } from "@/os/ui/labels";
import { areaPorClave } from "@/os/ui/navegacion";

export const metadata: Metadata = { title: "Clientes · Valme OS" };

/**
 * Pantalla 1 del MD: la cartera. Con `?area=paid` (o marca, crm…) es además el paso
 * intermedio cuando se abre un área de cliente sin cliente activo: cada fila lleva a esa
 * área del cliente elegido.
 */
export default async function ClientsPage({
  searchParams,
}: { searchParams: Promise<{ area?: string }> }) {
  const { member } = await requireMember();
  const rows = await clientSummaries();
  const destino = areaPorClave((await searchParams).area);
  const area = destino?.porCliente ? destino : null;

  return (
    <>
      <PageHeader
        title={area ? `${area.nombre}: elige un cliente` : "Clientes"}
        description={
          area
            ? `${area.nombre} trabaja sobre un cliente. Elige uno y quedará como cliente activo.`
            : "Cada cliente tiene su Brand Kit, sus ofertas y sus leads. Todo lo que hagas dentro queda acotado a él."
        }
        action={
          member.role === "admin" ? (
            <Link href="/app/clients/new">
              <Button variant="primary">Nuevo cliente</Button>
            </Link>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Todavía no tienes clientes asignados"
          body="Pide a un administrador que te dé acceso a alguno."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Cliente</Th>
              <Th>Estado</Th>
              <Th>Brand Kit</Th>
              <Th className="text-right">Ofertas</Th>
              <Th className="text-right">Leads (30 d)</Th>
              <Th className="text-right">Coste IA</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.client.id} className="hover:bg-os-sunken">
                <Td>
                  <Link href={area ? area.href(r.client.slug) : `/app/c/${r.client.slug}`} className="font-medium hover:underline">
                    {r.client.name}
                  </Link>
                  {r.client.websiteUrl ? (
                    <span className="ml-2 text-[12px] text-os-faint">
                      {r.client.websiteUrl.replace(/^https?:\/\//, "")}
                    </span>
                  ) : null}
                </Td>
                <Td><ClientStatusBadge s={r.client.status} /></Td>
                <Td><KitStatus s={r.brandKitStatus} /></Td>
                <Td className="os-num text-right">{r.offers}</Td>
                <Td className="os-num text-right">{r.leads30d}</Td>
                <Td className="os-num text-right text-os-muted">{fmtUsd(r.costUsd)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <p className="mt-3 text-xs text-os-faint">
        El coste de IA sale de <code>ai_jobs</code>: toda generación abre una fila con sus tokens y su coste.
      </p>
    </>
  );
}
