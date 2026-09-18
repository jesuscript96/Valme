import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  decidirAprobacion,
  getCommandCenter,
  type Approval,
  type CommandCenter,
} from "@/lib/command-center.functions";

export const Route = createFileRoute("/_authenticated/centro-de-mando")({
  head: () => ({
    meta: [
      { title: "Centro de mando · VALME Search OS" },
      {
        name: "description",
        content:
          "Atención prioritaria, capacidad de cartera, carga de agentes y actividad verificable de la agencia.",
      },
      { property: "og:title", content: "Centro de mando · VALME Search OS" },
      {
        property: "og:description",
        content: "Aprobaciones, bloqueos, SLA, cartera y carga de agentes en una sola pantalla.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CentroDeMando,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-sm text-destructive">
      No se ha podido cargar el centro de mando: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm text-muted-foreground">Sin datos disponibles.</div>,
});

const etiquetasEstado: Record<string, string> = {
  propuesto_ia: "Propuesto por IA",
  en_revision: "En revisión",
  bloqueado: "Bloqueado",
  aprobado: "Aprobado",
  piloto_automatico: "Piloto automático",
  revision: "En revisión",
  onboarding: "Onboarding",
};

function formatoFecha(valor: string | null) {
  if (!valor) return "Sin fecha";
  return new Date(valor).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CentroDeMando() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cargar = useServerFn(getCommandCenter);
  const decidir = useServerFn(decidirAprobacion);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  const { data, isPending, error } = useQuery<CommandCenter>({
    queryKey: ["command-center"],
    queryFn: () => cargar(),
  });

  const mutacion = useMutation({
    mutationFn: (variables: { approvalId: string; decision: "aprobado" | "devuelto" | "en_revision" }) =>
      decidir({ data: { ...variables, motivo: motivo || undefined } }),
    onSuccess: (_resultado, variables) => {
      setMotivo("");
      setSeleccion(null);
      setAviso(
        variables.decision === "aprobado"
          ? "Decisión registrada. Aprobar no inicia la ejecución."
          : variables.decision === "devuelto"
            ? "Devuelto al agente. El problema sigue abierto."
            : "Revisión humana iniciada. El bloqueo sigue abierto.",
      );
      queryClient.invalidateQueries({ queryKey: ["command-center"] });
    },
  });

  async function salir() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isPending) {
    return <div className="p-10 font-mono text-xs uppercase tracking-widest text-muted-foreground">Cargando…</div>;
  }
  if (error || !data) {
    return (
      <div role="alert" className="p-10 text-sm text-destructive">
        No se ha podido cargar el centro de mando.
      </div>
    );
  }

  const abierta = data.cola.find((a) => a.id === seleccion) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-primary">VALME Search OS</p>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Centro de mando</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground sm:inline">
              Datos de demostración
            </span>
            <Link
              to="/tareas"
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              Tareas
            </Link>
            <button
              type="button"
              onClick={salir}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-6 py-8">
        {aviso ? (
          <p className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground">
            {aviso}
          </p>
        ) : null}

        <section aria-labelledby="atencion">
          <h2 id="atencion" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Atención prioritaria
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metrica titulo="Pendientes de decisión" valor={data.atencion.pendientes} />
            <Metrica titulo="Críticas" valor={data.atencion.criticas} tono="alerta" />
            <Metrica titulo="SLA vencidos" valor={data.atencion.slaVencidos} tono="alerta" />
            <Metrica titulo="Bloqueos abiertos" valor={data.atencion.bloqueos} tono="alerta" />
          </div>
        </section>

        <section aria-labelledby="cartera">
          <h2 id="cartera" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Capacidad y cartera
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
              <div className="flex items-end justify-between">
                <p className="text-4xl font-semibold tracking-tight text-card-foreground">
                  {data.cartera.total}
                  <span className="ml-2 font-mono text-sm text-muted-foreground">
                    / {data.cartera.techo} clientes
                  </span>
                </p>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {data.cartera.plazas} plazas hasta el techo
                </p>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min((data.cartera.total / data.cartera.techo) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Dato titulo="Piloto automático" valor={data.cartera.piloto} />
                <Dato titulo="En revisión" valor={data.cartera.revision} />
                <Dato titulo="Bloqueados" valor={data.cartera.bloqueado} />
                <Dato titulo="Onboarding" valor={data.cartera.onboarding} />
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Las plazas hasta el techo no equivalen a la capacidad real de incorporación: la recomendación
                operativa es de {data.cartera.altasSemanales} altas semanales.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Actividad automatizada
              </h3>
              <ul className="mt-4 space-y-4">
                {data.actividad.slice(0, 5).map((item) => (
                  <li key={item.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <p className="text-sm text-card-foreground">{item.descripcion}</p>
                    <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                      {item.cliente} · {item.agente} · {item.resultado ?? "Sin resultado"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="cola">
          <div className="flex items-baseline justify-between">
            <h2 id="cola" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cola de supervisión
            </h2>
            <p className="text-xs text-muted-foreground">La IA propone; tú decides.</p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            <ul className="space-y-3 lg:col-span-3">
              {data.cola.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSeleccion(item.id === seleccion ? null : item.id)}
                    aria-expanded={item.id === seleccion}
                    className={`w-full rounded-xl border p-5 text-left transition-colors ${
                      item.id === seleccion
                        ? "border-primary bg-card"
                        : "border-border bg-card hover:border-muted-foreground/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Estado estado={item.estado} />
                      {item.prioridad === "critica" ? <Etiqueta tono="alerta">Crítica</Etiqueta> : null}
                      {item.sla_vence && new Date(item.sla_vence) < new Date() ? (
                        <Etiqueta tono="alerta">SLA vencido</Etiqueta>
                      ) : null}
                    </div>
                    <p className="mt-3 text-base font-medium text-card-foreground">{item.accion}</p>
                    <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                      {item.cliente} · {item.agente} · confianza {item.confianza}% · {formatoFecha(item.sla_vence)}
                    </p>
                  </button>
                </li>
              ))}
              {data.cola.length === 0 ? (
                <li className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                  No hay decisiones pendientes.
                </li>
              ) : null}
            </ul>

            <div className="lg:col-span-2">
              <Expediente
                aprobacion={abierta}
                motivo={motivo}
                onMotivo={setMotivo}
                enviando={mutacion.isPending}
                onDecidir={(decision) =>
                  abierta && mutacion.mutate({ approvalId: abierta.id, decision })
                }
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="agentes">
          <h2 id="agentes" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Carga de agentes
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.agentes.map((agente) => (
              <div key={agente.id} className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm font-medium text-card-foreground">{agente.nombre}</p>
                <p className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  {agente.especialidad}
                </p>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${agente.carga >= 75 ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${Math.min(agente.carga, 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Carga {agente.carga}% · {agente.disponibilidad === "saturado" ? "Saturado" : "Disponible"} ·
                  calidad {agente.calidad} · {agente.errores} errores
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="registro">
          <h2 id="registro" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Registro de decisiones
          </h2>
          <ul className="mt-4 space-y-2">
            {data.decisiones.map((decision) => (
              <li
                key={decision.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3"
              >
                <span className="text-sm text-card-foreground">{decision.accion}</span>
                <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  {decision.decision} · {formatoFecha(decision.created_at)}
                </span>
              </li>
            ))}
            {data.decisiones.length === 0 ? (
              <li className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                Todavía no hay decisiones registradas.
              </li>
            ) : null}
          </ul>
        </section>

        <p className="border-t border-border pt-6 text-xs text-muted-foreground">
          Datos ficticios de demostración. Aprobar no equivale a ejecutar y autorizar un envío no lo realiza.
        </p>
      </main>
    </div>
  );
}

function Metrica({ titulo, valor, tono }: { titulo: string; valor: number; tono?: "alerta" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">{titulo}</p>
      <p
        className={`mt-3 text-3xl font-semibold tracking-tight ${
          tono === "alerta" && valor > 0 ? "text-destructive" : "text-card-foreground"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div>
      <p className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-xl font-semibold text-card-foreground">{valor}</p>
    </div>
  );
}

function Etiqueta({ children, tono }: { children: React.ReactNode; tono?: "alerta" }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest ${
        tono === "alerta"
          ? "border-destructive/50 text-destructive"
          : "border-border text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}

function Estado({ estado }: { estado: string }) {
  return <Etiqueta>{etiquetasEstado[estado] ?? estado}</Etiqueta>;
}

function Expediente({
  aprobacion,
  motivo,
  onMotivo,
  onDecidir,
  enviando,
}: {
  aprobacion: Approval | null;
  motivo: string;
  onMotivo: (valor: string) => void;
  onDecidir: (decision: "aprobado" | "devuelto" | "en_revision") => void;
  enviando: boolean;
}) {
  if (!aprobacion) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
        Selecciona una acción de la cola para ver su expediente, la evidencia y el impacto antes de decidir.
      </div>
    );
  }

  return (
    <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
      <h3 className="text-base font-semibold text-card-foreground">{aprobacion.accion}</h3>
      <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
        {aprobacion.cliente} · {aprobacion.agente}
      </p>

      <dl className="mt-5 space-y-4 text-sm">
        <div>
          <dt className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">Evidencia</dt>
          <dd className="mt-1 text-card-foreground">{aprobacion.evidencia ?? "Sin evidencia registrada."}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">Impacto</dt>
          <dd className="mt-1 text-card-foreground">{aprobacion.impacto ?? "Sin impacto descrito."}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">Confianza</dt>
          <dd className="mt-1 text-card-foreground">
            {aprobacion.confianza}% — evaluación de demostración, no una probabilidad calibrada.
          </dd>
        </div>
      </dl>

      <label htmlFor="motivo" className="mt-6 block font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
        Motivo (obligatorio al devolver)
      </label>
      <textarea
        id="motivo"
        rows={3}
        value={motivo}
        onChange={(e) => onMotivo(e.target.value)}
        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={enviando}
          onClick={() => onDecidir("aprobado")}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-60"
        >
          Aprobar
        </button>
        <button
          type="button"
          disabled={enviando || motivo.trim().length === 0}
          onClick={() => onDecidir("devuelto")}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          Devolver al agente
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={() => onDecidir("en_revision")}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
        >
          Iniciar revisión
        </button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Aprobar cierra la decisión humana, no confirma que la ejecución haya empezado.
      </p>
    </div>
  );
}
