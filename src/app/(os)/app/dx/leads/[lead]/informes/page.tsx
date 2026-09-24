import Link from "next/link";
import { diagnostico } from "@/os/dx/repo";
import { HERRAMIENTAS } from "@/os/audit/tools";
import { Badge, Card, EmptyState, PageHeader, Table, Td, Th } from "@/os/ui/primitives";
import { fmtDateTime } from "@/os/ui/labels";

export const metadata = { title: "Informes · Valme OS" };

/** Todo lo que tenemos de este dominio, en una tabla. */
export default async function Informes({ params }: { params: Promise<{ lead: string }> }) {
  const { lead: id } = await params;
  const dx = await diagnostico();
  const lead = await dx.leads.get(id);
  const informes = await dx.auditorias.porLead(id);

  return (
    <>
      <nav className="mb-3 text-[12px] text-os-faint">
        <Link href="/app/dx/leads" className="hover:underline">Leads</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/app/dx/leads/${id}`} className="hover:underline">{lead.empresa}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-os-muted">Informes</span>
      </nav>

      <PageHeader
        title="Informes"
        description={`Lo que tenemos de ${lead.dominio}. Cada informe guarda sus hallazgos y lo que no se pudo comprobar.`}
      />

      {informes.length === 0 ? (
        <EmptyState
          title="Sin informes todavía"
          body="Con el dominio basta para sacar el primero. No hace falta pedirle accesos a nadie."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Fecha</Th>
              <Th>Herramienta</Th>
              <Th className="text-right">Señales</Th>
              <Th>Hallazgos</Th>
              <Th>Limitaciones</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {informes.map((a) => (
              <tr key={a.id} className="hover:bg-os-sunken">
                <Td className="os-num whitespace-nowrap text-os-muted">{fmtDateTime(a.ejecutadaEn)}</Td>
                <Td className="font-medium">{HERRAMIENTAS[a.herramienta].nombre}</Td>
                <Td className="os-num text-right">{a.señales}</Td>
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {a.resumen.p0 > 0 ? <Badge tone="accent">{a.resumen.p0} P0</Badge> : null}
                    {a.resumen.p1 > 0 ? <Badge tone="accent">{a.resumen.p1} P1</Badge> : null}
                    {a.resumen.p2 > 0 ? <Badge tone="warn">{a.resumen.p2} P2</Badge> : null}
                    {a.resumen.p3 > 0 ? <Badge>{a.resumen.p3} P3</Badge> : null}
                    {a.resumen.positivos > 0 ? <Badge tone="ok">{a.resumen.positivos} bien</Badge> : null}
                  </span>
                </Td>
                <Td className="text-[12px] text-os-muted">
                  {a.fuentesNoDisponibles.length
                    ? `${a.fuentesNoDisponibles.length} fuente${a.fuentesNoDisponibles.length > 1 ? "s" : ""} sin consultar`
                    : "—"}
                </Td>
                <Td className="text-right">
                  <Link
                    href={`/app/dx/leads/${id}/informes/${a.id}`}
                    className="text-[12px] text-os-muted hover:text-os-text hover:underline"
                  >
                    Ver informe
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Card className="mt-4 p-4">
        <p className="text-[13px] leading-relaxed text-os-muted">
          Un informe no caduca, pero envejece: los hallazgos describen cómo estaba el dominio
          el día que se ejecutó. Antes de llevar uno a una reunión, comprueba la fecha.
        </p>
      </Card>
    </>
  );
}
