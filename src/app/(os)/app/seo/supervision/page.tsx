import Link from "next/link";
import { seoModulo } from "@/os/seo";
import { colaSupervision, type TipoSupervision } from "@/os/seo/operacion/panel";
import { Estado, fmtDia } from "@/os/seo/ui/etiquetas";
import { Card, CardHeader, EmptyState, PageHeader, cx } from "@/os/ui/primitives";

export const metadata = { title: "Supervisión · SEO · Valme OS" };

const FILTROS = ["Todos", "Aprobación", "Bloqueo", "Riesgo", "Gestionadas"] as const;

/**
 * Cola de supervisión: decisiones, no tareas. Todo lo que espera a una persona, calculado
 * de los datos (autorizar, validar, decidir planes, activar altas, aprobar informes,
 * accesos que bloquean trabajo, tareas vencidas, caídas de visibilidad).
 */
export default async function Supervision({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const filtro = FILTROS.find((x) => x === f) ?? "Todos";
  const seo = await seoModulo();
  const cola = colaSupervision(seo.datos, seo.ambito);
  const gestionadas = seo.actividad
    .filter((x) => x.estado === "Acción completada" && /aprobad|autorizad|validad|decisión|revisión de calidad|plan v/i.test(x.texto))
    .slice(-20)
    .reverse();
  const cuenta = (t: (typeof FILTROS)[number]) =>
    t === "Todos" ? cola.length : t === "Gestionadas" ? gestionadas.length : cola.filter((x) => x.tipo === (t as TipoSupervision)).length;
  const lista = filtro === "Todos" ? cola : cola.filter((x) => x.tipo === filtro);

  return (
    <>
      <PageHeader title="Decisiones, no tareas." description="Lo que espera a una persona, por impacto: primero lo que bloquea, después lo que hay que aprobar y los riesgos. Cada elemento lleva a su evidencia." />
      <div className="mb-4 flex flex-wrap gap-1.5 text-[12px]">
        {FILTROS.map((x) => (
          <Link key={x} href={x === "Todos" ? "/app/seo/supervision" : `/app/seo/supervision?f=${x}`} aria-pressed={filtro === x}
            className={cx("rounded-md border px-2 py-1", filtro === x ? "border-os-text bg-os-text text-white" : "border-os-border bg-os-surface text-os-muted hover:text-os-text")}>
            {x} · {cuenta(x)}
          </Link>
        ))}
      </div>

      {filtro === "Gestionadas" ? (
        <Card>
          <CardHeader title="Decisiones registradas" />
          {gestionadas.length ? (
            <ul className="divide-y divide-os-border">
              {gestionadas.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                  <span><span className="font-medium">{x.texto}</span> <span className="text-xs text-os-muted">· {x.por} · {fmtDia(x.en)}</span></span>
                  {x.enlace ? <Link href={x.enlace} className="text-xs underline">Abrir</Link> : null}
                </li>
              ))}
            </ul>
          ) : <p className="px-4 py-5 text-[13px] text-os-muted">✓ No hay elementos en esta vista.</p>}
        </Card>
      ) : lista.length ? (
        <ul className="divide-y divide-os-border rounded-lg border border-os-border bg-os-surface">
          {lista.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 space-y-0.5">
                <p className="text-[12px]"><Estado t={x.estado} /> <span className="ml-1 text-os-faint">{x.tipo}{x.vence ? ` · vence ${fmtDia(x.vence)}` : ""}</span></p>
                <p className="text-[13px] font-medium">{x.titulo}</p>
                <p className="text-xs text-os-muted">{seo.cliente(x.clientId)?.name ?? "Empresa nueva"} · {x.especialidad} · {x.detalle}</p>
              </div>
              <Link href={x.enlace} className="text-[13px] font-medium hover:underline">Revisar →</Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="✓ No hay elementos en esta vista." body="Cuando algo necesite una decisión humana, aparecerá aquí con su enlace." />
      )}
    </>
  );
}
