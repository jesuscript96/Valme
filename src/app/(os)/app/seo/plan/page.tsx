import Link from "next/link";
import { referencias, rutaAuditoria, seoModulo, vencida } from "@/os/seo";
import { moverTareaAccion } from "@/os/seo/acciones";
import { seguimientoAbierto } from "@/os/seo/estados";
import { AGENTES, DECISION_LABEL, TIPO_TAREA_LABEL, type Tarea } from "@/os/seo/tipos";
import { TareaBadge, fmtDia } from "@/os/seo/ui/etiquetas";
import { ActionButton } from "@/os/ui/ActionButton";
import { Card, EmptyState, PageHeader, cx } from "@/os/ui/primitives";

export const metadata = { title: "Plan y tareas · SEO · Valme OS" };

/**
 * El plan: todas las tareas de seguimiento de los hallazgos, por estado. Una tarea es una
 * investigación (hay que averiguar algo para decidir) o una acción del plan (hay que
 * hacer algo, con criterio de hecho). Cerrar se hace en el hallazgo, que es donde está el
 * contexto para escribir la conclusión.
 */
export default async function Plan({
  searchParams,
}: { searchParams: Promise<{ mias?: string; tipo?: string }> }) {
  const f = await searchParams;
  const seo = await seoModulo();
  const mias = f.mias === "1";
  const tipo = f.tipo === "investigacion" || f.tipo === "accion" ? f.tipo : null;

  const refs = new Map<string, string>();
  for (const a of seo.auditorias) {
    for (const [k, v] of referencias(seo.hallazgos.filter((h) => h.auditoriaId === a.id), "H")) refs.set(k, v);
  }

  const tareas = seo.tareas
    .filter((t) => (mias ? t.responsableId === seo.actor.id : true))
    .filter((t) => (tipo ? t.tipo === tipo : true));
  const porFecha = (a: Tarea, b: Tarea) => (a.fecha ?? "9999").localeCompare(b.fecha ?? "9999");
  const columnas = [
    { titulo: "Pendientes", tareas: tareas.filter((t) => t.estado === "pendiente").sort(porFecha) },
    { titulo: "En curso", tareas: tareas.filter((t) => t.estado === "en_curso").sort(porFecha) },
    {
      titulo: "Cerradas",
      tareas: tareas
        .filter((t) => t.estado === "hecha" || t.estado === "cancelada")
        .sort((a, b) => (b.cerradaEn ?? "").localeCompare(a.cerradaEn ?? ""))
        .slice(0, 20),
    },
  ];

  const enlace = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const todo = { mias: mias ? "1" : null, tipo, ...cambios };
    for (const [k, v] of Object.entries(todo)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/app/seo/plan?${s}` : "/app/seo/plan";
  };
  const pms = seo.clientes.flatMap((c) => seo.pmsDe(c.id));
  const nombrePm = (id: string) => pms.find((p) => p.id === id)?.nombre ?? "PM asignado";

  return (
    <>
      <PageHeader
        title="Plan y tareas"
        description="Lo que se ha decidido hacer con cada hallazgo, con responsable, agente y fecha. Las vencidas salen marcadas."
      />

      <div className="mb-4 flex flex-wrap gap-1.5 text-[12px]">
        <Link href={enlace({ mias: null })} className={chip(!mias)}>Todas</Link>
        <Link href={enlace({ mias: "1" })} className={chip(mias)}>Las mías</Link>
        <span className="mx-1 w-px bg-os-border" />
        <Link href={enlace({ tipo: null })} className={chip(!tipo)}>Todos los tipos</Link>
        <Link href={enlace({ tipo: "investigacion" })} className={chip(tipo === "investigacion")}>Investigaciones</Link>
        <Link href={enlace({ tipo: "accion" })} className={chip(tipo === "accion")}>Acciones del plan</Link>
      </div>

      {tareas.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {columnas.map((col) => (
            <section key={col.titulo} className="space-y-2">
              <h2 className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-wide text-os-faint">
                {col.titulo}
                <span className="os-num">{col.tareas.length}</span>
              </h2>
              {col.tareas.map((t) => {
                const a = seo.auditorias.find((x) => x.id === t.auditoriaId);
                const h = seo.hallazgos.find((x) => x.id === t.hallazgoId);
                const agente = AGENTES.find((x) => x.id === t.agenteId);
                const abiertaAqui = a && seguimientoAbierto(a) && t.estado === "pendiente";
                return (
                  <Card key={t.id} className="space-y-1.5 px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="rounded bg-os-sunken px-1.5 py-0.5 font-medium text-os-muted">
                        {TIPO_TAREA_LABEL[t.tipo]}
                      </span>
                      <TareaBadge e={t.estado} vencida={vencida(t)} />
                    </div>
                    <p className="text-[13px] font-medium leading-snug text-os-text">{t.titulo}</p>
                    <p className="text-xs text-os-muted">
                      {a ? `${seo.cliente(a.clientId)?.name} · ${a.ref}` : ""}
                      {refs.get(t.hallazgoId) ? ` · ${refs.get(t.hallazgoId)}` : ""}
                      {h ? ` · ${h.titulo}` : ""}
                    </p>
                    <p className="text-xs text-os-muted">
                      PM: {nombrePm(t.responsableId)} · {agente ? agente.nombre : "Sin agente"} · {fmtDia(t.fecha)}
                    </p>
                    {t.conclusion && (t.estado === "hecha" || t.estado === "cancelada") ? (
                      <p className="text-xs text-os-text">
                        {t.conclusion}
                        {t.resultado ? ` → ${DECISION_LABEL[t.resultado]}` : ""}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Link
                        href={`${rutaAuditoria(t.auditoriaId)}?tab=hallazgos#h-${t.hallazgoId}`}
                        className="text-[12px] font-medium text-os-text underline-offset-2 hover:underline"
                      >
                        {t.estado === "hecha" || t.estado === "cancelada" ? "Ver hallazgo →" : "Abrir para cerrar →"}
                      </Link>
                      {abiertaAqui ? (
                        <ActionButton action={moverTareaAccion.bind(null, t.id, "en_curso")} size="sm">
                          Empezar
                        </ActionButton>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
              {!col.tareas.length ? (
                <p className="rounded-lg border border-dashed border-os-border px-3 py-6 text-center text-xs text-os-faint">
                  Nada aquí
                </p>
              ) : null}
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Todavía no hay tareas"
          body="Las tareas nacen de los hallazgos: al decidir «Investigar» se abre una investigación, y al decidir «Priorizar», una acción del plan."
          action={<Link href="/app/seo/auditorias" className="text-[13px] font-medium underline">Ir a Auditorías</Link>}
        />
      )}
    </>
  );
}

const chip = (activo: boolean) =>
  cx(
    "rounded-md border px-2 py-1 transition-colors",
    activo
      ? "border-os-text bg-os-text text-white"
      : "border-os-border bg-os-surface text-os-muted hover:text-os-text",
  );
