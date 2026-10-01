import Link from "next/link";
import {
  agenteAccion, cerrarTareaAccion, crearTareaAccion, decidirAccion, moverTareaAccion,
} from "@/os/seo/acciones";
import { rutaAuditoria, vencida, type Persona } from "@/os/seo";
import {
  AGENTES, CATEGORIA_LABEL, CONFIANZA_LABEL, DECISIONES, DECISION_LABEL, TIPO_TAREA_LABEL,
  type Actor, type Auditoria, type Hallazgo, type Tarea, type TipoTarea,
} from "@/os/seo/tipos";
import { DecisionBadge, PrioridadBadge, TareaBadge, fmtDia } from "@/os/seo/ui/etiquetas";
import { Desplegable, Formulario } from "@/os/seo/ui/Formulario";
import { ActionButton } from "@/os/ui/ActionButton";
import { Card, EmptyState, Field, Input, Select, Textarea } from "@/os/ui/primitives";

type Props = {
  a: Auditoria;
  actor: Actor;
  pms: Persona[];
  bloqueada: boolean;
  hallazgos: Hallazgo[];
  tareas: Tarea[];
  refH: Map<string, string>;
  refE: Map<string, string>;
};

export function Hallazgos(p: Props) {
  const decididos = p.hallazgos.filter((h) => h.decision.valor !== "pendiente").length;
  if (!p.hallazgos.length) {
    return (
      <EmptyState
        title="Todavía no hay hallazgos"
        body="Salen al ejecutar el motor SEO con la auditoría en ejecución, o al cargar una revisión externa."
      />
    );
  }
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-os-text">Hallazgos</h2>
        <span className="os-num text-[11px] uppercase tracking-wide text-os-faint">
          {decididos} de {p.hallazgos.length} con decisión
        </span>
      </div>
      {p.hallazgos.map((h) => (
        <FichaHallazgo key={h.id} h={h} {...p} />
      ))}
    </section>
  );
}

function FichaHallazgo({ h, a, actor, pms, bloqueada, tareas, refH, refE }: Props & { h: Hallazgo }) {
  const propias = tareas.filter((t) => t.hallazgoId === h.id);
  return (
    <Card id={`h-${h.id}`} className="scroll-mt-6">
      <div className="space-y-2 px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <PrioridadBadge p={h.prioridad} />
            {h.decision.valor !== "pendiente" ? <DecisionBadge d={h.decision.valor} /> : null}
          </div>
          <span className="os-num text-[11px] text-os-faint">{refH.get(h.id)}</span>
        </div>
        <h3 className="text-sm font-semibold text-os-text">{h.titulo}</h3>
        <p className="text-xs text-os-muted">
          {[CATEGORIA_LABEL[h.categoria] ?? h.categoria, h.servicio]
            .filter((x, i, todos) => todos.indexOf(x) === i)
            .join(" · ")}{" "}
          · {CONFIANZA_LABEL[h.confianza]} ·{" "}
          {h.responsable}
        </p>
        <p className="text-[13px] leading-relaxed text-os-text">{h.descripcion}</p>
        <p className="text-[13px] leading-relaxed">
          <span className="font-medium">Impacto:</span> {h.impacto}
        </p>
        <p className="text-[13px] leading-relaxed">
          <span className="font-medium">Recomendación:</span> {h.recomendacion}
        </p>
        <p className="text-[13px]">
          <span className="font-medium">Evidencia:</span>{" "}
          {h.evidencias.length
            ? h.evidencias.map((id, i) => (
                <span key={id}>
                  {i ? ", " : ""}
                  <Link
                    href={`${rutaAuditoria(a.id)}?tab=evidencias#e-${id}`}
                    className="os-num underline-offset-2 hover:underline"
                  >
                    {refE.get(id) ?? "—"}
                  </Link>
                </span>
              ))
            : "sin evidencia registrada"}
        </p>
        {h.limitaciones.length ? (
          <p className="text-xs text-os-muted">
            <span className="font-medium">Límites:</span> {h.limitaciones.join(" ")}
          </p>
        ) : null}
      </div>

      <div className="border-t border-os-border bg-os-sunken/40 px-4 py-3">
        {actor.pm && !bloqueada ? (
          <Formulario accion={decidirAccion.bind(null, h.id)} boton="Guardar decisión" variante="secondary">
            <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
              <Field label="Decisión del PM">
                <Select name="decision" defaultValue={h.decision.valor}>
                  {DECISIONES.map((d) => (
                    <option key={d} value={d}>{DECISION_LABEL[d]}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Nota" hint="Obligatoria para descartar.">
                <Textarea name="nota" defaultValue={h.decision.nota} className="min-h-9" />
              </Field>
            </div>
          </Formulario>
        ) : (
          <p className="text-[13px] text-os-muted">
            Decisión: <span className="font-medium text-os-text">{DECISION_LABEL[h.decision.valor]}</span>
            {h.decision.nota ? ` · ${h.decision.nota}` : ""}
          </p>
        )}
        <p className="mt-2 text-[11px] text-os-faint">
          {h.decision.por ? `Decidido por ${h.decision.por} · ${fmtDia(h.decision.en)}` : "Sin decisión todavía"}
        </p>
      </div>

      <Seguimiento h={h} tareas={propias} actor={actor} pms={pms} bloqueada={bloqueada} />
    </Card>
  );
}

function Seguimiento({
  h, tareas, actor, pms, bloqueada,
}: { h: Hallazgo; tareas: Tarea[]; actor: Actor; pms: Persona[]; bloqueada: boolean }) {
  // La decisión abre el camino: investigar pide una investigación; priorizar, una acción.
  const sugerida: TipoTarea | null =
    h.decision.valor === "investigar" ? "investigacion" : h.decision.valor === "priorizar" ? "accion" : null;
  const nombre = (id: string) => pms.find((p) => p.id === id)?.nombre ?? "PM asignado";

  return (
    <div className="border-t border-os-border px-4 py-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-os-faint">Seguimiento</p>

      {tareas.length ? (
        <ul className="mb-3 space-y-3">
          {tareas.map((t) => {
            const agente = AGENTES.find((x) => x.id === t.agenteId);
            const cerrada = t.estado === "hecha" || t.estado === "cancelada";
            return (
              <li key={t.id} className="rounded-md border border-os-border bg-os-surface px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded bg-os-sunken px-1.5 py-0.5 font-medium text-os-muted">
                    {TIPO_TAREA_LABEL[t.tipo]}
                  </span>
                  <TareaBadge e={t.estado} vencida={vencida(t)} />
                </div>
                <p className="mt-1 text-[13px] font-medium text-os-text">{t.titulo}</p>
                <p className="text-[13px] text-os-muted">{t.detalle}</p>
                {t.criterio ? <p className="text-xs text-os-muted">Hecho cuando: {t.criterio}</p> : null}
                <p className="mt-1 text-xs text-os-muted">
                  PM: {nombre(t.responsableId)} · {agente ? `Agente: ${agente.nombre}` : "Sin agente"} · Fecha límite:{" "}
                  {fmtDia(t.fecha)}
                </p>
                {t.conclusion ? (
                  <p className="mt-1 text-xs text-os-text">
                    <span className="font-medium">{cerrada ? (t.estado === "hecha" ? "Conclusión" : "Cancelada") : "Nota"}:</span>{" "}
                    {t.conclusion}
                    {t.resultado ? ` → hallazgo marcado como ${DECISION_LABEL[t.resultado]}` : ""}
                  </p>
                ) : null}
                {cerrada ? (
                  <p className="mt-1 text-[11px] text-os-faint">
                    Cerrada por {t.cerradaPor} · {fmtDia(t.cerradaEn)}
                  </p>
                ) : null}

                {!cerrada && !bloqueada ? (
                  <div className="mt-2 flex flex-wrap items-start gap-2">
                    {t.estado === "pendiente" ? (
                      <ActionButton action={moverTareaAccion.bind(null, t.id, "en_curso")} size="sm">
                        Empezar
                      </ActionButton>
                    ) : null}
                    {t.estado === "pendiente" && t.tipo === "investigacion" && actor.pm ? (
                      <ActionButton
                        action={agenteAccion.bind(null, t.id)}
                        size="sm"
                        pendingLabel="Consultando…"
                        confirm="El agente hará una sola petición HTTPS a la portada del dominio y enlazará el resultado como evidencia. ¿Seguir?"
                      >
                        Probar agente HTTP
                      </ActionButton>
                    ) : null}
                    <Desplegable titulo="Cerrar…">
                      <Formulario accion={cerrarTareaAccion.bind(null, t.id)} boton="Cerrar tarea" className="w-96">
                        <Field label={t.tipo === "investigacion" ? "Conclusión de la investigación" : "Qué se ha hecho"}>
                          <Textarea
                            name="conclusion"
                            required={t.tipo === "investigacion"}
                            placeholder="Qué has averiguado y con qué fuente"
                          />
                        </Field>
                        {t.tipo === "investigacion" ? (
                          <Field label="Decisión sobre el hallazgo">
                            <Select name="resultado" defaultValue="">
                              <option value="">Mantener la decisión actual</option>
                              <option value="priorizar">Priorizar</option>
                              <option value="descartar">Descartar</option>
                            </Select>
                          </Field>
                        ) : null}
                      </Formulario>
                    </Desplegable>
                    <ActionButton
                      action={moverTareaAccion.bind(null, t.id, "cancelada")}
                      size="sm"
                      variant="ghost"
                      confirm="¿Cancelar la tarea? Una tarea cerrada no se puede reabrir."
                    >
                      Cancelar tarea
                    </ActionButton>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {!bloqueada ? (
        <div className="flex flex-wrap gap-2">
          {(["investigacion", "accion"] as const).map((tipo) => (
            <NuevaTarea
              key={tipo}
              tipo={tipo}
              h={h}
             
              pms={pms}
              actor={actor}
              abierta={sugerida === tipo && !tareas.some((t) => t.tipo === tipo)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NuevaTarea({
  tipo, h, pms, actor, abierta,
}: { tipo: TipoTarea; h: Hallazgo; pms: Persona[]; actor: Actor; abierta: boolean }) {
  const investigacion = tipo === "investigacion";
  return (
    <details open={abierta} className="w-full">
      <summary className="inline-flex h-7 cursor-pointer list-none items-center rounded-md border border-os-border bg-os-surface px-2.5 text-[13px] font-medium text-os-text hover:bg-os-sunken [&::-webkit-details-marker]:hidden">
        + {TIPO_TAREA_LABEL[tipo]}
      </summary>
      <div className="mt-3 rounded-lg border border-os-border bg-os-sunken/40 p-4">
        <p className="mb-3 text-[13px] font-medium text-os-text">
          Nueva {investigacion ? "tarea de investigación" : "acción del plan"}
        </p>
        <Formulario accion={crearTareaAccion.bind(null, h.id, tipo)} boton="Crear tarea">
          <Field label="Título">
            <Input
              name="titulo"
              required
              defaultValue={investigacion ? `Investigar: ${h.titulo}` : h.titulo}
            />
          </Field>
          <Field label={investigacion ? "Pregunta que hay que responder" : "Qué hay que hacer"}>
            <Textarea
              name="detalle"
              required
              placeholder={
                investigacion
                  ? "¿Qué hay que averiguar para decidir? Por ejemplo: ¿se busca «departamento de marketing externo»?"
                  : h.recomendacion
              }
            />
          </Field>
          {!investigacion ? (
            <Field label="Criterio de hecho">
              <Input name="criterio" placeholder="Cómo sabremos que está terminado" />
            </Field>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="PM responsable">
              <Select name="responsableId" defaultValue={pms.some((p) => p.id === actor.id) ? actor.id : pms[0]?.id}>
                {pms.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </Select>
            </Field>
            <Field label="Agente">
              <Select name="agenteId" defaultValue="">
                <option value="">Sin agente</option>
                {AGENTES.map((x) => (
                  <option key={x.id} value={x.id}>{x.nombre} · {x.especialidad}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha límite">
              <Input name="fecha" type="date" />
            </Field>
          </div>
        </Formulario>
      </div>
    </details>
  );
}
