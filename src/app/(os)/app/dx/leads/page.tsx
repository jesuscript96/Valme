import Link from "next/link";
import { FileText, Play } from "lucide-react";
import type { Metadata } from "next";
import { diagnostico } from "@/os/dx/repo";
import { ESTADO_LABEL } from "@/os/dx/types";
import { Badge, Button, EmptyState, PageHeader, Table, Td, Th, type Tone } from "@/os/ui/primitives";
import { listas, CLAVES } from "@/os/audit/tools";
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

  // Cuántas herramientas dan sus dueños por buenas. Mientras sea cero, el atajo de
  // diagnóstico completo lleva a la pantalla que explica qué falta en vez de ejecutar.
  const preparadas = listas().length;

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
              <Th>Estado</Th>
              <Th className="text-right">Diagnóstico</Th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-os-sunken">
                <Td className="os-num whitespace-nowrap text-[12px] text-os-muted">{fmtDateTime(l.recibidoEn)}</Td>
                <Td>
                  <Link href={`/app/dx/leads/${l.id}`} className="font-medium hover:underline">
                    {l.empresa}
                  </Link>
                  <span className="block text-[12px] text-os-faint">{l.dominio}</span>
                </Td>
                <Td>
                  <span className="block text-[12px]">{l.contacto ?? "—"}</span>
                  <span className="block text-[12px] text-os-faint">{l.email}</span>
                  <span className="block text-[11px] text-os-faint">{l.origen}</span>
                </Td>
                <Td className="whitespace-nowrap">
                  <Badge tone={TONO[l.estado]}>{ESTADO_LABEL[l.estado]}</Badge>
                  {l.clienteSlug ? (
                    <Link
                      href={`/app/c/${l.clienteSlug}`}
                      className="mt-1 block text-[11px] text-os-muted underline"
                    >
                      ver cuenta
                    </Link>
                  ) : null}
                </Td>
                <Td>
                  <span className="flex items-center justify-end gap-1.5">
                    {(porLead.get(l.id) ?? 0) > 0 ? (
                      <Link
                        href={`/app/dx/leads/${l.id}/informes`}
                        title={`Ver ${porLead.get(l.id)} informe${porLead.get(l.id) === 1 ? "" : "s"}`}
                      >
                        <Button size="sm" variant="secondary">
                          <FileText className="size-3.5" aria-hidden />
                          <span className="os-num">{porLead.get(l.id)}</span>
                        </Button>
                      </Link>
                    ) : null}
                    <Link href={`/app/dx/leads/${l.id}/diagnostico`} className="shrink-0">
                      <Button size="sm" variant={preparadas > 0 ? "primary" : "ghost"}>
                        <Play className="size-3.5" aria-hidden />
                        Ejecutar
                      </Button>
                    </Link>
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <p className="mt-3 text-xs leading-relaxed text-os-faint">
        Un lead ganado no se borra: se enlaza a su cuenta y el histórico se queda aquí.
        {preparadas === 0
          ? ` · «Ejecutar» lanzaría las ${CLAVES.length} herramientas a la vez, pero ninguna está dada por buena todavía: se encienden solas según sus dueños las terminen.`
          : ` · «Ejecutar» lanza las ${preparadas} herramientas que están listas.`}
      </p>
    </>
  );
}
