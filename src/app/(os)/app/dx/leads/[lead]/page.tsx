import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { diagnostico } from "@/os/dx/repo";
import { ESTADO_LABEL } from "@/os/dx/types";
import { HERRAMIENTAS, CLAVES } from "@/os/audit/tools";
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader } from "@/os/ui/primitives";
import { fmtDateTime } from "@/os/ui/labels";

export default async function LeadDetail({
  params,
}: {
  params: Promise<{ lead: string }>;
}) {
  const { lead: id } = await params;
  const dx = await diagnostico();
  const lead = await dx.leads.get(id);
  const auditorias = await dx.auditorias.porLead(id);

  return (
    <>
      <nav className="mb-3 text-[12px] text-os-faint">
        <Link href="/app/dx/leads" className="hover:underline">Leads</Link>
        <span className="mx-1.5">/</span>
        <span className="text-os-muted">{lead.empresa}</span>
      </nav>

      <PageHeader
        title={lead.empresa}
        description={lead.dominio}
        action={
          lead.clienteSlug ? (
            <Link href={`/app/c/${lead.clienteSlug}`}>
              <Button>
                Ir a la cuenta <ArrowRight className="size-3.5" aria-hidden />
              </Button>
            </Link>
          ) : (
            <Button variant="primary" disabled>Convertir en cliente</Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader title="El registro" />
          <dl className="divide-y divide-os-border">
            {([
              ["Estado", ESTADO_LABEL[lead.estado]],
              ["Contacto", lead.contacto],
              ["Email", lead.email],
              ["Teléfono", lead.telefono],
              ["Origen", lead.origen],
              ["Recibido", fmtDateTime(lead.recibidoEn)],
            ] as const).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 px-4 py-2.5">
                <dt className="text-[12px] text-os-faint">{k}</dt>
                <dd className="min-w-0 break-words text-[13px] text-os-text">{v ?? "—"}</dd>
              </div>
            ))}
          </dl>
          {lead.mensaje ? (
            <div className="border-t border-os-border p-4">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-os-faint">Lo que escribió</p>
              <p className="text-[13px] leading-relaxed text-os-text">«{lead.mensaje}»</p>
            </div>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Auditar este dominio" />
            <div className="grid gap-2 p-4 sm:grid-cols-3">
              {CLAVES.map((c) => (
                <Link key={c} href={`/app/dx/tools/${c}?dominio=${encodeURIComponent(lead.dominio)}`}>
                  <Card className="h-full p-3 transition-colors hover:border-os-border-strong">
                    <p className="text-[13px] font-medium text-os-text">
                      {HERRAMIENTAS[c].nombre.replace("Auditoría ", "")}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-os-muted">
                      {HERRAMIENTAS[c].descripcion}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title={`Auditorías hechas (${auditorias.length})`} />
            {auditorias.length === 0 ? (
              <EmptyState
                title="Sin auditar todavía"
                body="Con el dominio basta. No hace falta pedirle accesos a nadie para empezar."
              />
            ) : (
              <ul className="divide-y divide-os-border">
                {auditorias.map((a) => {
                  const graves = a.resumen.p0 + a.resumen.p1;
                  return (
                    <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="min-w-0 flex-1">
                        <Link
                          href={`/app/dx/leads/${lead.id}/informes/${a.id}`}
                          className="block text-[13px] font-medium text-os-text hover:underline"
                        >
                          {HERRAMIENTAS[a.herramienta].nombre}
                        </Link>
                        <span className="os-num block text-[11px] text-os-faint">
                          {fmtDateTime(a.ejecutadaEn)} · {a.señales} señales · {(a.duracionMs / 1000).toFixed(0)} s
                        </span>
                      </span>
                      {graves > 0 ? <Badge tone="accent">{graves} graves</Badge> : null}
                      {a.resumen.positivos > 0 ? (
                        <Badge tone="ok">{a.resumen.positivos} bien</Badge>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
