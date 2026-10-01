import Link from "next/link";
import { notFound } from "next/navigation";
import { rutaAuditoria, seoModulo } from "@valme/os/seo";
import { alClienteActivo } from "@valme/os/seo/equivalente";
import { accesoAccion } from "@valme/os/seo/operacion/acciones";
import { bloqueos, estadoCliente, rutaPlan, ultimoPlan } from "@valme/os/seo/operacion/diagnostico";
import { estadoInforme, rutaInforme } from "@valme/os/seo/operacion/informes";
import { pendientes, requisitos, rutaAlta } from "@valme/os/seo/operacion/onboarding";
import { colaSupervision } from "@valme/os/seo/operacion/panel";
import { ESPECIALIDADES, ESTADOS_ACCESO, HERRAMIENTAS_ACCESO } from "@valme/os/seo/operacion/tipos";
import { EstadoBadge, Estado, fmtDia } from "@valme/os/seo/ui/etiquetas";
import { Formulario } from "@valme/os/seo/ui/Formulario";
import { Badge, Card, CardHeader, EmptyState, Select, cx } from "@valme/os/ui/primitives";
import { Diagnostico } from "./Diagnostico";

const PESTAÑAS = [
  ["resumen", "Resumen"], ["servicio", "Servicio"], ["onboarding", "Onboarding"], ["diagnostico", "Diagnóstico"],
  ["objetivos", "Objetivos"], ["accesos", "Accesos"], ["equipo", "Equipo"], ["plan", "Plan"],
  ["entregables", "Entregables"], ["resultados", "Resultados"], ["decisiones", "Decisiones"], ["historial", "Historial"],
] as const;
type Pestaña = (typeof PESTAÑAS)[number][0];

export async function generateMetadata({ params }: { params: Promise<{ cliente: string }> }) {
  const { cliente } = await params;
  const seo = await seoModulo();
  return { title: `${seo.cliente(cliente)?.name ?? "Cliente"} · SEO · Valme OS` };
}

/** Ficha del cliente en el servicio SEO, con las doce pestañas de Search OS. */
export default async function FichaCliente({
  params, searchParams,
}: { params: Promise<{ cliente: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { cliente: clientId } = await params;
  const { tab } = await searchParams;
  const seo = await seoModulo();
  const c = seo.cliente(clientId);
  if (!c) notFound();
  alClienteActivo.ficha(seo, c.id, tab);
  const d = seo.datos;
  const a = d.altas.find((x) => x.clientId === c.id) ?? null;
  const e = d.encargos.find((x) => x.clientId === c.id) ?? null;
  const plan = e ? ultimoPlan(e) : null;
  const pestaña: Pestaña = PESTAÑAS.some(([k]) => k === tab) ? (tab as Pestaña) : "resumen";
  const base = `/app/seo/clientes/${c.id}`;
  const auditorias = d.auditorias.filter((x) => x.clientId === c.id);
  const informes = d.informes.filter((x) => x.clientId === c.id);
  const mediciones = d.mediciones.filter((m) => m.clientId === c.id && m.estado === "medida").sort((x, y) => y.en.localeCompare(x.en));
  const dato = (k: string) => (a?.datos as Record<string, string> | undefined)?.[k] || "Pendiente";

  return (
    <>
      <nav className="mb-3 text-[13px] text-os-muted"><Link href="/app/seo/clientes" className="hover:text-os-text">← Cartera</Link></nav>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="os-num text-[11px] uppercase tracking-wide text-os-faint">{a?.id ?? "Sin alta"}{e ? ` · ${e.id}` : ""}</p>
          <h1 className="font-display text-xl font-semibold tracking-tight">{c.name}</h1>
          <p className="mt-1 text-[13px] text-os-muted">{a?.servicios.join(" + ") || "Servicio sin definir"} · {c.websiteUrl ?? "sin web"}</p>
        </div>
        <Estado t={estadoCliente(a, e)} />
      </header>

      <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-os-border">
        {PESTAÑAS.map(([k, label]) => (
          <Link key={k} href={k === "resumen" ? base : `${base}?tab=${k}`} aria-current={pestaña === k ? "page" : undefined}
            className={cx("-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[13px]", pestaña === k ? "border-os-accent font-medium text-os-text" : "border-transparent text-os-muted hover:text-os-text")}>
            {label}
          </Link>
        ))}
      </nav>

      {!a && pestaña !== "resumen" && pestaña !== "resultados" && pestaña !== "entregables" ? (
        <EmptyState title="Este cliente no tiene alta en el servicio SEO" body="El onboarding recoge alcance, objetivos, accesos y equipo antes de empezar." action={<Link href="/app/seo/onboarding" className="text-[13px] font-medium underline">Abrir onboarding →</Link>} />
      ) : null}

      {pestaña === "resumen" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Objetivo y próximo resultado" />
            <dl className="space-y-3 px-4 py-4 text-[13px]">
              <div><dt className="text-[11px] uppercase text-os-faint">Objetivo</dt><dd>{a?.datos.objetivos || "Objetivo pendiente de definir en el onboarding."}</dd></div>
              <div><dt className="text-[11px] uppercase text-os-faint">Plan activo</dt><dd>{plan ? `Plan v${plan.version} · ${plan.estado}` : "Auditoría → estrategia → ejecución → calidad"}</dd></div>
              <div><dt className="text-[11px] uppercase text-os-faint">Responsable humano</dt><dd>{a?.datos.pm || "Sin asignar"}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="Estado de gobierno" action={a ? <Estado t={a.estado === "Activo" ? "Onboarding activo" : "Onboarding incompleto"} /> : null} />
            <div className="space-y-2 px-4 py-4 text-[13px]">
              {a ? <p>{pendientes(a).length} campos obligatorios pendientes · {HERRAMIENTAS_ACCESO.filter((h) => a.accesos[h.id] === "Validado").length} accesos validados</p> : <p>Sin alta en el servicio.</p>}
              <p className="text-xs text-os-muted">Acciones sensibles bajo autorización humana: publicar, enviar comunicaciones, cambiar presupuesto, modificar permisos y eliminar información.</p>
              <Link href={a ? `${rutaAlta(a.id)}?paso=H` : "/app/seo/onboarding"} className="text-[13px] font-medium underline">Abrir onboarding →</Link>
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Auditorías" action={<Link href="/app/seo/auditorias/nueva" className="text-[12px] text-os-muted hover:text-os-text">Nueva →</Link>} />
            {auditorias.length ? (
              <ul className="divide-y divide-os-border">
                {auditorias.map((x) => (
                  <li key={x.id}><Link href={rutaAuditoria(x.id)} className="flex items-center justify-between px-4 py-2.5 text-[13px] hover:bg-os-sunken/50"><span><span className="os-num font-medium">{x.ref}</span> <span className="text-os-muted">{x.dominio}</span></span><EstadoBadge e={x.estado} /></Link></li>
                ))}
              </ul>
            ) : <p className="px-4 py-5 text-[13px] text-os-muted">Sin auditorías.</p>}
          </Card>
        </div>
      ) : null}

      {pestaña === "servicio" && a ? (
        <Card>
          <CardHeader title="Servicio contratado" />
          <dl className="grid gap-x-6 gap-y-3 px-4 py-4 text-[13px] sm:grid-cols-2">
            {[["Servicios", a.servicios.join(", ") || "Pendiente"], ["Entregables y frecuencia", dato("entregables")], ["Exclusiones", dato("exclusiones")], ["Límites de consumo", dato("limites")], ["Inicio", dato("inicio")], ["Revisión del servicio", dato("revision")]].map(([k, v]) => (
              <div key={k}><dt className="text-[11px] uppercase text-os-faint">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <p className="border-t border-os-border px-4 py-3 text-xs text-os-muted">Cambiar el alcance o el presupuesto exige una nueva aprobación; la anterior no la cubre.</p>
        </Card>
      ) : null}

      {pestaña === "onboarding" && a ? (
        <Card>
          <CardHeader title={`Onboarding ${a.id}`} action={<Estado t={a.estado} />} />
          <ul className="divide-y divide-os-border">
            {requisitos(a).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                <span>{r.label} <span className="text-xs text-os-muted">· {r.detalle}</span></span>
                <Estado t={r.ok ? "Cumplido" : "Pendiente"} />
              </li>
            ))}
          </ul>
          <div className="flex gap-3 border-t border-os-border px-4 py-3 text-[13px]">
            <Link href={`${rutaAlta(a.id)}?paso=${a.estado === "Activo" ? "H" : "A"}`} className="font-medium underline">{a.estado === "Activo" ? "Consultar asistente" : "Continuar el asistente"}</Link>
            <Link href={`${rutaAlta(a.id)}?paso=A&vista=cliente`} className="text-os-muted hover:text-os-text">Vista del cliente</Link>
          </div>
        </Card>
      ) : null}

      {pestaña === "diagnostico" && a ? <Diagnostico e={e} a={a} nombre={c.name} pm={seo.actor.pm} /> : null}

      {pestaña === "objetivos" && a ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Negocio y objetivos" />
            <dl className="space-y-3 px-4 py-4 text-[13px]">
              {[["Prioridades", dato("prioritarios")], ["Público y mercados", dato("publico")], ["Competidores", dato("competidores")], ["Indicadores", dato("indicadores")], ["Situación inicial", dato("base")]].map(([k, v]) => (
                <div key={k}><dt className="text-[11px] uppercase text-os-faint">{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <p className="border-t border-os-border px-4 py-3 text-xs text-os-muted">No se prometen posiciones ni resultados garantizados.</p>
          </Card>
          <Card>
            <CardHeader title="Marca y restricciones" />
            <div className="space-y-2 px-4 py-4 text-[13px]">
              <p>{dato("marca")}</p>
              <p><span className="font-medium">Restricciones:</span> {dato("restricciones")}</p>
              <p><span className="font-medium">Fuentes autorizadas:</span> {dato("fuentes")}</p>
            </div>
          </Card>
        </div>
      ) : null}

      {pestaña === "accesos" && a ? (
        <Card>
          <CardHeader title="Accesos e integraciones" action={e ? <Badge tone={e && bloqueos(e, a).length ? "accent" : "ok"}>{e && bloqueos(e, a).length ? `${bloqueos(e, a).length} bloqueo(s) activos` : "Sin bloqueos"}</Badge> : null} />
          <ul className="divide-y divide-os-border">
            {HERRAMIENTAS_ACCESO.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium">{h.nombre} <Estado t={a.accesos[h.id]} /></p>
                  <p className="text-xs text-os-muted">{h.finalidad} · permiso mínimo: {h.permiso}</p>
                </div>
                {a.estado === "Activo" ? (
                  <Formulario accion={accesoAccion.bind(null, a.id, h.id)} boton="Actualizar" variante="secondary" className="flex items-center gap-2 space-y-0" reiniciar={false}>
                    <Select name="estado" defaultValue={a.accesos[h.id]} className="h-7 w-40">
                      {ESTADOS_ACCESO.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Formulario>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="border-t border-os-border px-4 py-3 text-xs text-os-muted">
            {a.estado === "Activo"
              ? "Cada cambio queda registrado en el historial del encargo y reanuda o detiene solo el trabajo que dependía de ese acceso. Un plan ya generado no se modifica: haría falta una versión nueva. Nunca se piden contraseñas, claves ni tokens."
              : "Los accesos se editan en el paso E del onboarding mientras está en borrador."}
          </p>
        </Card>
      ) : null}

      {pestaña === "equipo" && a ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ESPECIALIDADES.map((esp, i) => {
              const asignado = a.equipo.includes(esp);
              return (
                <Card key={esp} className={cx("px-3 py-3", !asignado && "opacity-60")}>
                  <p className="text-[11px] uppercase text-os-faint">AG-{i + 1}</p>
                  <p className="text-[13px] font-medium">{esp}</p>
                  <p className="mt-1 text-xs text-os-muted">{asignado ? "Contexto exclusivo de este cliente" : "Fuera del alcance contratado"}</p>
                  {asignado ? <Link href={`/app/seo/agentes/${i + 1}`} className="mt-1 inline-block text-xs underline">Ver agente</Link> : null}
                </Card>
              );
            })}
          </div>
          <Card className="px-4 py-3 text-[13px]">
            <p><span className="font-medium">Project Manager:</span> {a.datos.pm || "Sin asignar"} · <span className="font-medium">Calidad:</span> {a.responsableCalidad || "Sin asignar"}</p>
            <p className="mt-1 text-xs text-os-muted">Los agentes trabajan con permisos limitados a esta cuenta; los reintentos están acotados y escalan al PM.</p>
          </Card>
        </div>
      ) : null}

      {pestaña === "plan" && a ? (
        plan && e ? (
          <Card>
            <CardHeader title={`Plan v${plan.version} · ${plan.acciones.length} acciones`} action={<Estado t={plan.estado} />} />
            <ul className="divide-y divide-os-border">
              {plan.acciones.map((x) => (
                <li key={x.n} className="px-4 py-2.5 text-[13px]"><span className="font-medium">{x.n}. {x.accion}</span> <span className="text-xs text-os-muted">· {x.agente} · {x.plazo} · {x.aprobacion}</span></li>
              ))}
            </ul>
            <Link href={rutaPlan(e.id)} className="block border-t border-os-border px-4 py-3 text-[13px] font-medium underline">Abrir plan y decisión del PM →</Link>
          </Card>
        ) : (
          <EmptyState title="Sin plan generado" body={`El plan se genera desde un diagnóstico validado por control de calidad. ${e ? `Estado actual del encargo: ${e.estado}.` : "Este cliente todavía no tiene encargo de diagnóstico."}`} action={<Link href={`${base}?tab=diagnostico`} className="text-[13px] font-medium underline">Ver diagnóstico →</Link>} />
        )
      ) : null}

      {pestaña === "entregables" ? (
        <Card>
          <CardHeader title="Entregables del ciclo" action={<Link href="/app/seo/informes" className="text-[12px] text-os-muted hover:text-os-text">Informes →</Link>} />
          {informes.length ? (
            <ul className="divide-y divide-os-border">
              {informes.map((i) => (
                <li key={i.id}><Link href={rutaInforme(i.id)} className="flex items-center justify-between px-4 py-2.5 text-[13px] hover:bg-os-sunken/50"><span><span className="os-num font-medium">{i.id}</span> {i.titulo}</span><Estado t={estadoInforme(d, i)} /></Link></li>
              ))}
            </ul>
          ) : <p className="px-4 py-5 text-[13px] text-os-muted">Sin informes todavía.</p>}
          <p className="border-t border-os-border px-4 py-3 text-xs text-os-muted">Aprobar el contenido y autorizar el envío son decisiones separadas.</p>
        </Card>
      ) : null}

      {pestaña === "resultados" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Visibilidad en asistentes" />
            {mediciones.length ? (
              <ul className="divide-y divide-os-border">
                {mediciones.slice(0, 6).map((m) => <li key={m.id} className="flex justify-between px-4 py-2.5 text-[13px]"><span>{fmtDia(m.en)}</span><span className="os-num">{m.menciones}/{m.consultas.length} respuestas{m.posicion ? ` · #${m.posicion}` : ""}</span></li>)}
              </ul>
            ) : <p className="px-4 py-5 text-[13px] text-os-muted">Sin datos · pendiente de medir en Visibilidad IA.</p>}
          </Card>
          <Card>
            <CardHeader title="Limitaciones y datos ausentes" />
            <div className="space-y-1 px-4 py-4 text-[13px]">
              {a ? (
                HERRAMIENTAS_ACCESO.filter((h) => a.accesos[h.id] !== "Validado").map((h) => <p key={h.id}>{h.nombre}: <span className="text-os-muted">{a.accesos[h.id]}</span></p>)
              ) : <p className="text-os-muted">Sin alta: no hay accesos declarados.</p>}
              {a && HERRAMIENTAS_ACCESO.every((h) => a.accesos[h.id] === "Validado") ? <p>Todos los accesos del alcance están validados.</p> : null}
              <p className="pt-2 text-xs text-os-muted">Sin Search Console ni Analytics validados no se muestran clics ni conversiones: no mostramos estimaciones cuando falta la medición.</p>
            </div>
          </Card>
        </div>
      ) : null}

      {pestaña === "decisiones" ? (
        <Card>
          <CardHeader title="Decisiones y aprobaciones" />
          {(() => {
            const cola = colaSupervision(d, new Set([c.id]));
            return cola.length ? (
              <ul className="divide-y divide-os-border">
                {cola.map((x) => <li key={x.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]"><span><Estado t={x.estado} /> <span className="ml-1 font-medium">{x.titulo}</span> <span className="text-xs text-os-muted">· {x.especialidad}</span></span><Link href={x.enlace} className="text-xs underline">Abrir</Link></li>)}
              </ul>
            ) : <p className="px-4 py-5 text-[13px] text-os-muted">Sin decisiones abiertas para este cliente.</p>;
          })()}
          {a?.excepciones.length ? <p className="border-t border-os-border px-4 py-3 text-xs text-os-warn">Excepciones del PM: {a.excepciones.map((x) => x.motivo).join(" · ")}</p> : null}
        </Card>
      ) : null}

      {pestaña === "historial" ? (
        <Card>
          <CardHeader title="Historial" />
          <ul className="space-y-1 px-4 py-3 text-xs text-os-muted">
            {[...(a?.historial ?? []), ...(e?.historial ?? [])].map((h, i) => <li key={i}>{h}</li>)}
            {!a ? <li>Sin actividad en el servicio SEO.</li> : null}
          </ul>
          <details className="border-t border-os-border px-4 py-3 text-xs text-os-muted">
            <summary className="cursor-pointer">Renovación, pausa y salida</summary>
            <p className="mt-2">
              Revisión del servicio: {dato("revision")}. Una pausa detiene los trabajos nuevos y obliga a decidir qué ocurre con los que
              están en curso. La salida contempla entrega de documentación, trabajos pendientes, retirada de accesos y conservación o
              eliminación de datos según la política aprobada. Nada se elimina automáticamente.
            </p>
          </details>
        </Card>
      ) : null}
    </>
  );
}
