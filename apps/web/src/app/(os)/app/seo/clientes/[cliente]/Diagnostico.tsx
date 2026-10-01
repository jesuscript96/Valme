import Link from "next/link";
import {
  declararAccion, enviarCalidadAccion, evidenciaAccion, generarPlanAccion, iniciarDiagnosticoAccion,
  revisarCalidadAccion,
} from "@valme/os/seo/operacion/acciones";
import {
  TITULO_IMPEDIMENTO, bloqueos, completo, disponibles, enCurso, estadoCliente, impedimentos, rutaPlan,
  sinCobertura, ultimoPlan, type Paso,
} from "@valme/os/seo/operacion/diagnostico";
import type { Alta, Encargo } from "@valme/os/seo/operacion/tipos";
import { Estado, fmtDia } from "@valme/os/seo/ui/etiquetas";
import { Desplegable, Formulario } from "@valme/os/seo/ui/Formulario";
import { ActionButton } from "@valme/os/ui/ActionButton";
import { Badge, Card, CardHeader, Field, Input, Textarea } from "@valme/os/ui/primitives";

/** Encargo de diagnóstico del cliente: estado, pasos, hallazgos, bloqueos y calidad. */
export function Diagnostico({ e, a, nombre, pm }: { e: Encargo | null; a: Alta | null; nombre: string; pm: boolean }) {
  if (!e || !a) {
    return (
      <Card className="px-4 py-6">
        <h2 className="text-sm font-semibold">Sin encargo de diagnóstico</h2>
        <p className="mt-1 text-[13px] text-os-muted">
          El diagnóstico se crea cuando el PM aprueba el onboarding. Este cliente aún no lo tiene.
        </p>
        <Link href="/app/seo/onboarding" className="mt-3 inline-block text-[13px] font-medium underline">Abrir onboarding →</Link>
      </Card>
    );
  }
  const bl = bloqueos(e, a);
  const disp = disponibles(e, a);
  const faltan = sinCobertura(e, a);
  const plan = ultimoPlan(e);
  const ultimaRevision = e.revisiones.at(-1);

  const pasos: { paso: Paso; label: string; visible: boolean; accion: () => Promise<{ ok: true } | { ok: false; error: string }> }[] = [
    { paso: "iniciar", label: "Iniciar diagnóstico", visible: e.estado === "Pendiente", accion: iniciarDiagnosticoAccion.bind(null, e.id) },
    { paso: "declarar", label: "Declarar datos ausentes y limitaciones", visible: enCurso(e, a) && ((bl.length > 0 && !e.limitacionesDeclaradas) || (faltan.length > 0 && !e.coberturaDeclarada)), accion: declararAccion.bind(null, e.id) },
    { paso: "enviar", label: "Enviar a control de calidad", visible: enCurso(e, a), accion: enviarCalidadAccion.bind(null, e.id) },
    { paso: "plan", label: "Generar plan de trabajo", visible: e.estado === "Completado" && !plan, accion: generarPlanAccion.bind(null, e.id) },
  ];
  const visibles = pasos.filter((p) => p.visible);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title={`Encargo ${e.id}`} action={<Estado t={e.estado} />} />
        <dl className="grid gap-x-6 gap-y-3 px-4 py-4 text-[13px] sm:grid-cols-2">
          {[
            ["Cliente", nombre],
            ["Servicio contratado", e.servicios.join(" + ") || "Sin definir"],
            ["Objetivos del onboarding", e.objetivos || "Sin objetivos"],
            ["Agentes asignados", e.agentes.join(", ") || "Sin agentes"],
            ["Estado del cliente", estadoCliente(a, e)],
            ["Creado", fmtDia(e.creadoEn)],
          ].map(([k, v]) => (
            <div key={k}><dt className="text-[11px] uppercase tracking-wide text-os-faint">{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <div className="space-y-3 border-t border-os-border px-4 py-3">
          <p className="text-xs text-os-muted">
            Estados posibles: Pendiente · En curso · Bloqueado · En revisión · Completado. El encargo es único por cliente.
          </p>
          {ultimaRevision ? (
            <p className="text-[13px]">
              Última revisión de calidad: <Estado t={ultimaRevision.resultado} /> · {ultimaRevision.comentario}
            </p>
          ) : null}
          <div className="flex flex-wrap items-start gap-2">
            {visibles.map((p) => {
              const imp = impedimentos(p.paso, e, a);
              return (
                <ActionButton key={p.paso} action={p.accion} variant={imp.length ? "secondary" : "primary"} size="sm" disabled={imp.length > 0}>
                  {p.label}
                </ActionButton>
              );
            })}
            {e.estado === "En revisión" && pm ? (
              <Desplegable titulo="Ejecutar revisión de calidad">
                <Formulario accion={revisarCalidadAccion.bind(null, e.id)} boton="Revisar y registrar resultado" className="w-96">
                  <p className="text-xs text-os-muted">
                    Se comprueban el alcance cubierto, la evidencia de cada hallazgo y las limitaciones declaradas. El resultado
                    (validado o devuelto) sale de esas comprobaciones.
                  </p>
                  <Field label="Comentario (opcional)"><Textarea name="comentario" className="min-h-14" /></Field>
                </Formulario>
              </Desplegable>
            ) : null}
            {plan ? (
              <Link href={rutaPlan(e.id)} className="inline-flex h-7 items-center rounded-md border border-os-border bg-os-surface px-2.5 text-[13px] font-medium hover:bg-os-sunken">
                Ver plan v{plan.version}
              </Link>
            ) : null}
          </div>
          {visibles.map((p) => {
            const imp = impedimentos(p.paso, e, a);
            return imp.length ? (
              <div key={p.paso} className="rounded-md border border-os-warn/30 bg-os-warn-soft px-3 py-2 text-xs text-os-warn">
                <p className="font-medium">No se puede continuar: {p.label.toLowerCase()}. {TITULO_IMPEDIMENTO[p.paso]}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {imp.map((i, k) => <li key={k}>{i.texto} <span className="text-os-text">Cómo resolverlo: {i.resolucion}</span></li>)}
                </ul>
              </div>
            ) : null;
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title={`Hallazgos (${e.hallazgos.length})`} action={<span className="os-num text-[11px] uppercase text-os-faint">{disp.length} sin bloqueo</span>} />
        {e.estado === "Pendiente" ? (
          <p className="px-4 py-5 text-[13px] text-os-muted">Sin datos: el diagnóstico no se ha iniciado.</p>
        ) : (
          <ul className="divide-y divide-os-border">
            {e.hallazgos.map((h) => {
              const bloqueado = Boolean(h.dep && a.accesos[h.dep] !== "Validado");
              return (
                <li key={h.ref} className="space-y-1.5 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={bloqueado ? "accent" : completo(h) ? "ok" : "warn"}>
                      {bloqueado ? "Bloqueado por acceso" : completo(h) ? "Hallazgo registrado" : "Evidencia incompleta"}
                    </Badge>
                    <Badge tone={h.prioridad === "Alta" ? "warn" : "neutral"}>Prioridad {h.prioridad}</Badge>
                    <span className="os-num text-[11px] text-os-faint">{h.ref} · {h.evidencia || "sin referencia"}</span>
                  </div>
                  <p className="text-[13px] font-medium">{h.titulo} <span className="font-normal text-os-muted">· {h.servicio}</span></p>
                  <p className="text-xs text-os-muted">Qué comprobar: {h.queComprobar}</p>
                  {completo(h) ? (
                    <p className="text-xs">
                      Fuente: {h.fuente} · {h.fecha}{h.impacto ? ` · Impacto: ${h.impacto}` : ""}{h.limitaciones ? ` · Limitaciones: ${h.limitaciones}` : ""}
                    </p>
                  ) : null}
                  {bloqueado ? (
                    <p className="text-xs text-os-accent">
                      Trabajo detenido solo en este hallazgo. Cómo resolverlo: solicitar el acceso con el permiso mínimo y marcarlo
                      como validado. Sin ese acceso no se mide nada ni se inventan cifras.
                    </p>
                  ) : enCurso(e, a) ? (
                    <Desplegable titulo={completo(h) ? "Corregir evidencia" : "Registrar evidencia"}>
                      <Formulario accion={evidenciaAccion.bind(null, e.id, h.ref)} boton="Guardar evidencia" className="w-full max-w-xl">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Field label="Fuente"><Input name="fuente" defaultValue={h.fuente} required placeholder="Search Console, CMS…" /></Field>
                          <Field label="Fecha"><Input name="fecha" type="date" defaultValue={h.fecha} required /></Field>
                          <Field label="Referencia"><Input name="evidencia" defaultValue={h.evidencia} required placeholder="EV-001, captura, informe…" /></Field>
                        </div>
                        <Field label="Impacto observado"><Input name="impacto" defaultValue={h.impacto} placeholder="Solo lo medido; sin estimaciones" /></Field>
                        <Field label="Limitaciones"><Input name="limitaciones" defaultValue={h.limitaciones} /></Field>
                      </Formulario>
                    </Desplegable>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {bl.length ? (
        <Card>
          <CardHeader title="Trabajo bloqueado por accesos" action={<Estado t={e.limitacionesDeclaradas ? "Limitaciones declaradas" : "Sin declarar"} />} />
          <ul className="divide-y divide-os-border">
            {bl.map((b) => (
              <li key={b.acceso} className="px-4 py-3 text-[13px]">
                <p className="font-medium">{b.nombre} · <span className="text-os-accent">{b.estado}</span></p>
                <p className="text-xs text-os-muted">Bloquea: {b.afectados.join(", ")}</p>
                <p className="text-xs text-os-muted">Resolución: el cliente concede {b.nombre} con permiso mínimo; después se marca como validado en Accesos. El resto del diagnóstico continúa.</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Control de calidad" action={<span className="os-num text-[11px] uppercase text-os-faint">{e.revisiones.length} revisiones</span>} />
        {e.revisiones.length ? (
          <ul className="divide-y divide-os-border">
            {e.revisiones.map((r) => (
              <li key={r.n} className="space-y-1 px-4 py-3 text-[13px]">
                <p><Estado t={r.resultado} /> <span className="ml-1 font-medium">Revisión {r.n}</span> <span className="text-xs text-os-muted">· {r.por} · {fmtDia(r.en)}</span></p>
                <ul className="space-y-0.5 text-xs">
                  {r.comprobaciones.map((c) => (
                    <li key={c.texto} className={c.ok ? "text-os-ok" : "text-os-accent"}>{c.ok ? "✓" : "×"} {c.texto} — <span className="text-os-muted">{c.detalle}</span></li>
                  ))}
                </ul>
                <p className="text-xs text-os-muted">{r.comentario}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-5 text-[13px] text-os-muted">Sin revisiones todavía.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Historial del encargo" />
        <ul className="space-y-1 px-4 py-3 text-xs text-os-muted">{e.historial.map((h, i) => <li key={i}>{h}</li>)}</ul>
      </Card>
    </div>
  );
}
