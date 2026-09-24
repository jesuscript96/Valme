import Link from "next/link";
import type { Metadata } from "next";
import { diagnostico } from "@/os/dx/repo";
import { ESTADO_LABEL } from "@/os/dx/types";
import { Badge, EmptyState, PageHeader, Table, Td, Th, type Tone } from "@/os/ui/primitives";
import { fmtDateTime } from "@/os/ui/labels";

export const metadata: Metadata = { title: "Leads · Valme OS" };

const TONO: Record<string, Tone> = {
  nuevo: "accent", auditado: "info", contactado: "warn", ganado: "ok", perdido: "neutral",
};

export default async function LeadsPage() {
  const dx = await diagnostico();
  const [leads, auditorias] = await Promise.all([
    dx.leads.list(),
    dx.auditorias.recientes(50),
  ]);
  const porLead = new Map<string, number>();
  for (const a of auditorias) {
    if (a.leadId) porLead.set(a.leadId, (porLead.get(a.leadId) ?? 0) + 1);
  }

  return (
    <>
      <PageHeader
        title="Leads"
        description="Lo que entra por el formulario. De cada uno tenemos el dominio, y con el dominio ya se puede auditar sin pedirle nada a nadie."
      />

      {leads.length === 0 ? (
        <EmptyState
          title="Todavía no ha entrado ningún lead"
          body="El formulario de la web de Valme aún no existe, así que no hay nada que pueda llegar aquí. Es lo primero que hay que montar."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Recibido</Th>
              <Th>Empresa</Th>
              <Th>Contacto</Th>
              <Th>Origen</Th>
              <Th>Estado</Th>
              <Th className="text-right">Auditorías</Th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-os-sunken">
                <Td className="os-num whitespace-nowrap text-os-muted">{fmtDateTime(l.recibidoEn)}</Td>
                <Td>
                  <Link href={`/app/dx/leads/${l.id}`} className="font-medium hover:underline">
                    {l.empresa}
                  </Link>
                  <span className="block text-[12px] text-os-faint">{l.dominio}</span>
                </Td>
                <Td>
                  <span className="block text-[12px]">{l.contacto ?? "—"}</span>
                  <span className="block text-[12px] text-os-faint">{l.email}</span>
                </Td>
                <Td className="text-[12px] text-os-muted">{l.origen}</Td>
                <Td>
                  <Badge tone={TONO[l.estado]}>{ESTADO_LABEL[l.estado]}</Badge>
                  {l.clienteSlug ? (
                    <Link
                      href={`/app/c/${l.clienteSlug}`}
                      className="ml-2 text-[11px] text-os-muted underline"
                    >
                      ver cuenta
                    </Link>
                  ) : null}
                </Td>
                <Td className="os-num text-right">{porLead.get(l.id) ?? 0}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <p className="mt-3 text-xs text-os-faint">
        Un lead ganado no se borra: se enlaza a su cuenta y el histórico se queda aquí.
      </p>
    </>
  );
}
