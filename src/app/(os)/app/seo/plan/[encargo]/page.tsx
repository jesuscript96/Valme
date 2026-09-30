import Link from "next/link";
import { notFound } from "next/navigation";
import { seoModulo } from "@/os/seo";
import { decidirPlanAccion, nuevaVersionAccion } from "@/os/seo/operacion/acciones";
import { estadoCliente, ultimoPlan } from "@/os/seo/operacion/diagnostico";
import { Estado, fmtDia } from "@/os/seo/ui/etiquetas";
import { Formulario } from "@/os/seo/ui/Formulario";
import { ActionButton } from "@/os/ui/ActionButton";
import { Card, CardHeader, EmptyState, Textarea } from "@/os/ui/primitives";

export async function generateMetadata({ params }: { params: Promise<{ encargo: string }> }) {
  const { encargo } = await params;
  return { title: `Plan ${encargo} · SEO · Valme OS` };
}

/** Plan de trabajo de un encargo: acciones propuestas, decisión del PM y versiones. */
export default async function PlanTrabajo({ params }: { params: Promise<{ encargo: string }> }) {
  const { encargo } = await params;
  const seo = await seoModulo();
  const e = seo.datos.encargos.find((x) => x.id === encargo && seo.clientes.some((c) => c.id === x.clientId));
  if (!e) notFound();
  const a = seo.datos.altas.find((x) => x.id === e.altaId) ?? null;
  const p = ultimoPlan(e);
  const nombre = seo.cliente(e.clientId)?.name ?? "Cliente";

  if (!p) {
    return <EmptyState title="Sin plan generado" body="El plan se genera desde el diagnóstico validado." action={<Link href={`/app/seo/clientes/${e.clientId}?tab=diagnostico`} className="text-[13px] underline">Ver diagnóstico →</Link>} />;
  }
  const decidida = p.estado !== "Pendiente de aprobación";

  return (
    <>
      <nav className="mb-3 text-[13px] text-os-muted"><Link href="/app/seo/plan" className="hover:text-os-text">← Plan y tareas</Link></nav>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="os-num text-[11px] uppercase tracking-wide text-os-faint">Plan / {e.id} · v{p.version}</p>
          <h1 className="font-display text-xl font-semibold tracking-tight">Plan de trabajo de {nombre}</h1>
          <p className="mt-1 text-[13px] text-os-muted">{e.servicios.join(" + ")} · {p.acciones.length} acciones</p>
        </div>
        <Estado t={p.estado} />
      </header>

      <Card className="mb-6">
        <dl className="grid gap-x-6 gap-y-3 px-4 py-4 text-[13px] sm:grid-cols-2">
          {[["Versión", `v${p.version} de ${e.planes.length}`], ["Origen", p.motivo], ["Diagnóstico", `${e.estado} · ${e.revisiones.length} revisiones de calidad`], ["Estado del cliente", estadoCliente(a, e)]].map(([k, v]) => (
            <div key={k}><dt className="text-[11px] uppercase text-os-faint">{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <p className="border-t border-os-border px-4 py-3 text-xs text-os-muted">
          Estado del cliente, estado del encargo y estado de la aprobación son distintos y se muestran por separado. Aprobar no ejecuta ni publica nada.
        </p>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Acciones propuestas" action={<span className="text-[11px] uppercase text-os-faint">Esfuerzo por estimar</span>} />
        <ul className="divide-y divide-os-border">
          {p.acciones.map((x) => (
            <li key={x.n} className="space-y-2 px-4 py-3">
              <p className="text-[13px]"><span className="rounded bg-os-sunken px-1.5 py-0.5 text-[11px] font-medium text-os-muted">Acción {x.n}</span> <span className="ml-1 font-medium">{x.accion}</span> <span className="ml-1 text-xs text-os-warn">{x.aprobacion}</span></p>
              <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                {[["Entregable", x.entregable], ["Criterio de aceptación", x.criterio], ["Agente responsable", x.agente], ["Dependencias", x.dependencias], ["Plazo", x.plazo], ["Esfuerzo", x.esfuerzo]].map(([k, v]) => (
                  <div key={k}><dt className="uppercase text-os-faint">{k}</dt><dd className="text-os-text">{v}</dd></div>
                ))}
              </dl>
              <p className="text-xs text-os-muted">{x.justifica}</p>
            </li>
          ))}
        </ul>
        {p.excluidas.length ? (
          <div className="border-t border-os-border px-4 py-3 text-xs text-os-warn">
            <p className="font-medium">Fuera del plan por falta de acceso</p>
            <ul className="mt-1 list-disc pl-4">{p.excluidas.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        ) : null}
      </Card>

      <Card className="mb-6">
        <CardHeader title="Decisión del Project Manager" />
        <div className="px-4 py-4">
          {!decidida && seo.actor.pm ? (
            <div className="space-y-3">
              <Formulario accion={decidirPlanAccion.bind(null, e.id, "Aprobado")} boton={`Aprobar plan v${p.version}`}>
                <Textarea name="comentario" maxLength={500} placeholder="Comentario (opcional al aprobar)" className="min-h-14" />
              </Formulario>
              <Formulario accion={decidirPlanAccion.bind(null, e.id, "Cambios solicitados")} boton="Solicitar cambios" variante="secondary">
                <Textarea name="comentario" maxLength={500} placeholder="Obligatorio: qué debe cambiar (mínimo 12 caracteres)" className="min-h-14" />
              </Formulario>
              <Formulario accion={decidirPlanAccion.bind(null, e.id, "Rechazado")} boton="Rechazar" variante="danger">
                <Textarea name="comentario" maxLength={500} placeholder="Obligatorio: por qué se rechaza (mínimo 12 caracteres)" className="min-h-14" />
              </Formulario>
              <p className="text-xs text-os-muted">La decisión queda vinculada a la versión v{p.version}. Aprobar deja el plan «Listo para ejecución»; no inicia trabajo.</p>
            </div>
          ) : !decidida ? (
            <p className="text-[13px] text-os-muted">Espera la decisión de un PM.</p>
          ) : (
            <div className="space-y-2 text-[13px]">
              <p><Estado t={p.estado} /> <span className="ml-1">{p.decisiones.at(-1)?.comentario}</span></p>
              {seo.actor.pm ? (
                <ActionButton action={nuevaVersionAccion.bind(null, e.id)} size="sm">
                  {p.estado === "Listo para ejecución" ? `Modificar plan aprobado (crea v${p.version + 1})` : `Aplicar cambios y crear v${p.version + 1}`}
                </ActionButton>
              ) : null}
              <p className="text-xs text-os-muted">Modificar un plan aprobado crea una versión nueva pendiente de revisión: la aprobación anterior no la cubre.</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Historial de decisiones" />
        <ul className="divide-y divide-os-border">
          {[...e.planes].reverse().map((v) => (
            <li key={v.version} className="space-y-1 px-4 py-3 text-[13px]">
              <p><Estado t={`v${v.version} · ${v.estado}`} /> <span className="ml-1 text-xs text-os-muted">{v.acciones.length} acciones · {fmtDia(v.creadoEn)}</span></p>
              <p className="text-xs text-os-muted">{v.motivo}</p>
              {v.decisiones.length ? v.decisiones.map((x, i) => <p key={i} className="text-xs">{fmtDia(x.en)} · {x.por} · {x.tipo}: {x.comentario}</p>) : <p className="text-xs text-os-faint">Sin decisión registrada.</p>}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
