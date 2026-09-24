import Link from "next/link";
import { CircleDashed, CircleCheck } from "lucide-react";
import { diagnostico } from "@/os/dx/repo";
import { CLAVES, ESTADO_LABEL, HERRAMIENTAS, listas } from "@/os/audit/tools";
import { Badge, Button, Card, CardHeader, PageHeader } from "@/os/ui/primitives";

/**
 * Lanzador del diagnóstico completo.
 *
 * Hoy no lanza nada porque ninguna herramienta está dada por buena todavía. No es un
 * botón muerto: **se enciende solo** según cada especialista cambie el estado de la
 * suya en `src/os/audit/tools.ts`. Esta pantalla no habrá que tocarla.
 */
export default async function LanzarDiagnostico({
  params,
}: {
  params: Promise<{ lead: string }>;
}) {
  const { lead: id } = await params;
  const dx = await diagnostico();
  const lead = await dx.leads.get(id);
  const preparadas = listas();

  return (
    <>
      <nav className="mb-3 text-[12px] text-os-faint">
        <Link href="/app/dx/leads" className="hover:underline">Leads</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/app/dx/leads/${id}`} className="hover:underline">{lead.empresa}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-os-muted">Diagnóstico</span>
      </nav>

      <PageHeader
        title="Diagnóstico completo"
        description={`Las tres herramientas sobre ${lead.dominio}, en una pasada. La recolección base se hace una sola vez, así que cuesta poco más que lanzar una.`}
      />

      <Card className="mb-4">
        <CardHeader title="Qué se va a ejecutar" />
        <ul className="divide-y divide-os-border">
          {CLAVES.map((c) => {
            const h = HERRAMIENTAS[c];
            const lista = h.estado === "listo";
            return (
              <li key={c} className="flex items-center gap-3 px-4 py-3">
                {lista
                  ? <CircleCheck className="size-4 shrink-0 text-os-ok" aria-hidden />
                  : <CircleDashed className="size-4 shrink-0 text-os-faint" aria-hidden />}
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-os-text">{h.nombre}</span>
                  <span className="block text-[12px] leading-relaxed text-os-muted">
                    {h.descripcion}
                  </span>
                </span>
                <Badge tone={lista ? "ok" : "neutral"}>{ESTADO_LABEL[h.estado]}</Badge>
                <Link href={`/app/dx/tools/${c}?dominio=${encodeURIComponent(lead.dominio)}`}>
                  <Button size="sm" variant="ghost">Lanzar suelta</Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      {preparadas.length === 0 ? (
        <Card className="border-os-warn/30 bg-os-warn-soft p-5">
          <p className="text-[13px] font-medium text-os-warn">
            Todavía no hay ninguna herramienta dada por buena
          </p>
          <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-os-warn">
            Las tres funcionan y se pueden lanzar sueltas desde arriba, pero ninguna está
            terminada. Cuando su especialista dé una por buena, cambia una línea en{" "}
            <code className="font-mono text-[12px]">src/os/audit/tools.ts</code> y aparece
            aquí sola. Esta pantalla no hay que tocarla.
          </p>
          <div className="mt-3">
            <Button variant="primary" disabled>Ejecutar diagnóstico</Button>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <p className="text-[13px] text-os-muted">
            Se ejecutarán {preparadas.length} de {CLAVES.length} herramientas. Tarda alrededor
            de un minuto.
          </p>
          <div className="mt-3">
            <Button variant="primary">Ejecutar diagnóstico</Button>
          </div>
        </Card>
      )}
    </>
  );
}
