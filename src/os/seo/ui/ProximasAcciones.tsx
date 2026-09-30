import Link from "next/link";
import { Card, CardHeader } from "@/os/ui/primitives";
import { abierta, rutaAuditoria, vencida, type Persona } from "../index";
import { AGENTES, TIPO_TAREA_LABEL, type Auditoria, type Hallazgo, type Tarea } from "../tipos";
import { TareaBadge, fmtDia } from "./etiquetas";

/** Tareas abiertas, las vencidas y las más próximas primero. */
export function ProximasAcciones({
  tareas, auditorias, hallazgos, pms, refHallazgo, clienteDe, limite,
}: {
  tareas: Tarea[];
  auditorias: Auditoria[];
  hallazgos: Hallazgo[];
  pms: Persona[];
  /** Referencia visible (H-01) de cada hallazgo, si se conoce. */
  refHallazgo?: Map<string, string>;
  /** Nombre del cliente de una auditoría, cuando la lista mezcla clientes. */
  clienteDe?: (clientId: string) => string | undefined;
  limite?: number;
}) {
  const abiertas = tareas
    .filter(abierta)
    .sort((a, b) => (a.fecha ?? "9999").localeCompare(b.fecha ?? "9999"));
  const visibles = limite ? abiertas.slice(0, limite) : abiertas;
  const nombre = (id: string) => pms.find((p) => p.id === id)?.nombre ?? "PM asignado";

  return (
    <Card>
      <CardHeader
        title="Próximas acciones"
        action={<span className="os-num text-[11px] uppercase tracking-wide text-os-faint">{abiertas.length} abiertas</span>}
      />
      {visibles.length ? (
        <ul className="divide-y divide-os-border">
          {visibles.map((t) => {
            const a = auditorias.find((x) => x.id === t.auditoriaId);
            const h = hallazgos.find((x) => x.id === t.hallazgoId);
            const agente = AGENTES.find((x) => x.id === t.agenteId);
            return (
              <li key={t.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-os-faint">
                    <span className="rounded bg-os-sunken px-1.5 py-0.5 font-medium text-os-muted">
                      {TIPO_TAREA_LABEL[t.tipo]}
                    </span>
                    <TareaBadge e={t.estado} vencida={vencida(t)} />
                    <span className="os-num">
                      {a && clienteDe ? `${clienteDe(a.clientId)} · ` : ""}
                      {a?.ref}
                      {refHallazgo?.get(t.hallazgoId) ? ` · ${refHallazgo.get(t.hallazgoId)}` : ""}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-os-text">{t.titulo}</p>
                  <p className="text-xs text-os-muted">
                    PM: {nombre(t.responsableId)} · {agente ? `Agente: ${agente.nombre}` : "Sin agente"} ·{" "}
                    {fmtDia(t.fecha)}
                    {h ? ` · ${h.titulo}` : ""}
                  </p>
                </div>
                <Link
                  href={`${rutaAuditoria(t.auditoriaId)}?tab=hallazgos#h-${t.hallazgoId}`}
                  className="shrink-0 text-[13px] font-medium text-os-text underline-offset-2 hover:underline"
                >
                  Ver hallazgo →
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-6 text-[13px] text-os-muted">
          No hay acciones abiertas. Las tareas nacen de decidir «Investigar» o «Priorizar» un hallazgo.
        </p>
      )}
      {limite && abiertas.length > limite ? (
        <Link href="/app/seo/plan" className="block border-t border-os-border px-4 py-2.5 text-[13px] text-os-muted hover:text-os-text">
          Ver las {abiertas.length} en Plan y tareas →
        </Link>
      ) : null}
    </Card>
  );
}
