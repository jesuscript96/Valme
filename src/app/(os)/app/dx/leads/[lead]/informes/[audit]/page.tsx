import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { diagnostico } from "@/os/dx/repo";
import { HERRAMIENTAS } from "@/os/audit/tools";
import { FUNCIONES, type Gravedad } from "@/os/audit/types";
import { Badge, Button, Card, CardHeader, PageHeader, type Tone } from "@/os/ui/primitives";
import { fmtDateTime } from "@/os/ui/labels";

const TONO: Record<Gravedad, Tone> = { p0: "accent", p1: "accent", p2: "warn", p3: "neutral" };

export default async function Informe({
  params,
}: {
  params: Promise<{ lead: string; audit: string }>;
}) {
  const { lead: leadId, audit: auditId } = await params;
  const dx = await diagnostico();
  const lead = await dx.leads.get(leadId);
  const informes = await dx.auditorias.porLead(leadId);
  const a = informes.find((x) => x.id === auditId);
  if (!a) notFound();

  const positivos = a.hallazgos.filter((h) => h.positivo);
  const problemas = a.hallazgos.filter((h) => !h.positivo);
  const h = HERRAMIENTAS[a.herramienta];

  return (
    <>
      <nav className="mb-3 text-[12px] text-os-faint">
        <Link href={`/app/dx/leads/${leadId}`} className="hover:underline">{lead.empresa}</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/app/dx/leads/${leadId}/informes`} className="hover:underline">Informes</Link>
        <span className="mx-1.5">/</span>
        <span className="text-os-muted">{h.nombre}</span>
      </nav>

      <PageHeader
        title={h.nombre}
        description={`${a.dominio} · ejecutado el ${fmtDateTime(a.ejecutadaEn)}`}
        action={
          <Link href={`/app/dx/tools/${a.herramienta}?dominio=${encodeURIComponent(a.dominio)}`}>
            <Button>Volver a ejecutar</Button>
          </Link>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
        {[
          ["Señales", String(a.señales)],
          ["Hallazgos", String(problemas.length)],
          ["Reconocidos", String(positivos.length)],
          ["Tiempo", `${(a.duracionMs / 1000).toFixed(1)} s`],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-[11px] uppercase tracking-wide text-os-faint">{k}</p>
            <p className="os-num mt-0.5 font-display text-[17px] font-semibold text-os-text">{v}</p>
          </div>
        ))}
      </Card>

      {a.fuentesNoDisponibles.length > 0 ? (
        <Card className="mb-4 border-os-warn/30 bg-os-warn-soft p-4">
          <p className="mb-2 flex items-center gap-2 text-[13px] font-medium text-os-warn">
            <AlertTriangle className="size-4" aria-hidden />
            Lo que no se pudo comprobar
          </p>
          <ul className="space-y-1.5">
            {a.fuentesNoDisponibles.map((f) => (
              <li key={f.fuente} className="text-[13px] leading-relaxed text-os-warn">
                <strong>{f.fuente}:</strong> {f.motivo}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] leading-relaxed text-os-warn">
            Esto va en la portada del informe que ve el cliente. No haber podido mirar algo no
            es lo mismo que que esté bien.
          </p>
        </Card>
      ) : null}

      {positivos.length > 0 ? (
        <Card className="mb-4">
          <CardHeader title="Lo que funciona" />
          <ul className="divide-y divide-os-border">
            {positivos.map((x) => (
              <li key={x.id} className="px-4 py-3">
                <p className="text-[13px] font-medium text-os-ok">{x.titulo}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-os-muted">{x.consecuencia}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={`Hallazgos (${problemas.length})`} />
        <ul className="divide-y divide-os-border">
          {problemas.map((x) => (
            <li key={x.id} className="px-4 py-3.5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone={TONO[x.gravedad]}>{x.gravedad.toUpperCase()}</Badge>
                <span className="text-[13px] font-semibold text-os-text">{x.titulo}</span>
                <span className="text-[11px] text-os-faint">{FUNCIONES[x.funcion].nombre}</span>
              </div>
              <dl className="space-y-1 text-[13px] leading-relaxed">
                {([["Situación", x.situacion], ["Consecuencia", x.consecuencia], ["Solución", x.solucion]] as const)
                  .map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[92px_minmax(0,1fr)] gap-2">
                      <dt className="text-[12px] text-os-faint">{k}</dt>
                      <dd className="min-w-0 text-os-text">{v}</dd>
                    </div>
                  ))}
              </dl>
              <p className="mt-2 font-mono text-[11px] text-os-faint">
                evidencia: {x.evidencia.join(", ")} · confianza {x.confianza}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
