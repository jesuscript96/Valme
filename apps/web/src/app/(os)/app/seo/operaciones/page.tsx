import Link from "next/link";
import { seoModulo } from "@valme/os/seo";
import { ciclo, recientes, registro } from "@valme/os/seo/operacion/panel";
import { Estado } from "@valme/os/seo/ui/etiquetas";
import { fmtDateTime } from "@valme/os/ui/labels";
import { Card, CardHeader, PageHeader } from "@valme/os/ui/primitives";

export const metadata = { title: "Operaciones · SEO · Valme OS" };

/** El trabajo y su trazabilidad: en qué etapa está cada cliente y todo lo que ha pasado. */
export default async function Operaciones({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const { n } = await searchParams;
  const seo = await seoModulo();
  const c = ciclo(seo.datos, seo.ambito);
  const todo = registro(seo.datos, seo.ambito);
  const limite = Math.max(20, Number(n) || 20);

  return (
    <>
      <PageHeader title="Operaciones" description="Los ciclos avanzan con sus agentes. Aquí consultas el trabajo y su trazabilidad." />
      <Card className="mb-6">
        <CardHeader title="Ciclo de trabajo" action={<span className="text-[11px] uppercase text-os-faint">Clientes por etapa</span>} />
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-3">
          {[
            ["Planificación", c.planificacion, "Diagnóstico y plan pendientes de decidir"],
            ["Ejecución", c.ejecucion, "Planes aprobados y auditorías en marcha"],
            ["Validación", c.validacion, "Calidad e informes antes de entregar"],
          ].map(([k, v, t]) => (
            <div key={k as string}>
              <p className="text-[11px] uppercase text-os-faint">{k}</p>
              <p className="os-num font-display text-2xl font-semibold">{v} <span className="text-sm font-normal text-os-muted">clientes</span></p>
              <p className="text-xs text-os-muted">{t}</p>
            </div>
          ))}
        </div>
        <p className="border-t border-os-border px-4 py-3 text-xs text-os-muted">Etapas del ciclo, independientes del estado operativo de cada cliente.</p>
      </Card>

      <Card>
        <CardHeader title="Registro reciente" action={<span className="os-num text-[11px] uppercase text-os-faint">{recientes(todo).length} acciones / 7 días</span>} />
        {todo.length ? (
          <ul className="divide-y divide-os-border">
            {todo.slice(0, limite).map((x) => (
              <li key={x.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[11px] text-os-faint">{fmtDateTime(x.en)} · {x.especialidad ?? "Equipo"} · {x.por}</p>
                  <p className="text-[13px] text-os-text">{x.texto}</p>
                  <p className="text-xs text-os-muted">{x.clientId ? seo.cliente(x.clientId)?.name : "Sin cliente"} · <Estado t={x.estado} /></p>
                </div>
                {x.enlace ? <Link href={x.enlace} className="text-xs underline">Evidencia</Link> : null}
              </li>
            ))}
          </ul>
        ) : <p className="px-4 py-5 text-[13px] text-os-muted">Sin actividad todavía.</p>}
        {todo.length > limite ? (
          <Link href={`/app/seo/operaciones?n=${limite + 30}`} className="block border-t border-os-border px-4 py-2.5 text-[13px] text-os-muted hover:text-os-text">Ver más →</Link>
        ) : null}
      </Card>
    </>
  );
}
