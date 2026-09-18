import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import {
  actualizarTarea,
  crearTarea,
  getTareas,
  FASES_TAREA,
  type EstadoTarea,
  type FaseTarea,
  type Tarea,
  type TareasVista,
} from "@/lib/tasks.functions";

export const Route = createFileRoute("/_authenticated/tareas")({
  head: () => ({
    meta: [
      { title: "Seguimiento de tareas · VALME Search OS" },
      {
        name: "description",
        content: "Tareas de la agencia con estado, responsable y fecha límite, con avisos de plazos vencidos.",
      },
      { property: "og:title", content: "Seguimiento de tareas · VALME Search OS" },
      {
        property: "og:description",
        content: "Estado, responsable y fecha límite de cada tarea supervisada por el Project Manager.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Tareas,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-sm text-destructive">
      No se han podido cargar las tareas: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm text-muted-foreground">Sin tareas disponibles.</div>,
});

const etiquetaEstado: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  bloqueada: "Bloqueada",
  completada: "Completada",
};

const etiquetaPrioridad: Record<string, string> = {
  baja: "Baja",
  normal: "Normal",
  alta: "Alta",
  critica: "Crítica",
};

const etiquetaFase: Record<FaseTarea, string> = {
  planificacion: "Planificación",
  desarrollo: "Desarrollo",
  revision: "Revisión",
  entrega: "Entrega",
};

const descripcionFase: Record<FaseTarea, string> = {
  planificacion: "Definir alcance, prioridad y responsable antes de producir nada.",
  desarrollo: "Trabajo en producción por el equipo o por un agente.",
  revision: "Control de calidad y decisiones del Project Manager.",
  entrega: "Entrega al cliente y cierre documentado.",
};

const estilosEstado: Record<EstadoTarea, string> = {
  pendiente: "border-border text-muted-foreground",
  en_curso: "border-primary/60 text-primary",
  bloqueada: "border-destructive/60 text-destructive",
  completada: "border-border text-muted-foreground line-through decoration-1",
};

function formatoFecha(valor: string | null) {
  if (!valor) return "Sin fecha límite";
  return new Date(valor).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function paraInput(valor: string | null) {
  if (!valor) return "";
  const fecha = new Date(valor);
  const mes = `${fecha.getMonth() + 1}`.padStart(2, "0");
  const dia = `${fecha.getDate()}`.padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function estaVencida(tarea: Tarea) {
  return tarea.estado !== "completada" && !!tarea.fecha_limite && new Date(tarea.fecha_limite).getTime() < Date.now();
}

function Tareas() {
  const queryClient = useQueryClient();
  const cargar = useServerFn(getTareas);
  const crear = useServerFn(crearTarea);
  const actualizar = useServerFn(actualizarTarea);

  const [filtroEstado, setFiltroEstado] = useState<"todas" | EstadoTarea>("todas");
  const [filtroResponsable, setFiltroResponsable] = useState("todos");
  const [filtroProyecto, setFiltroProyecto] = useState("todos");
  const [aviso, setAviso] = useState<string | null>(null);
  const [nueva, setNueva] = useState({
    titulo: "",
    responsable: "",
    proyecto: "",
    fase: "planificacion",
    fechaLimite: "",
    prioridad: "normal",
    clientId: "",
    detalle: "",
  });

  const { data, isPending, error } = useQuery<TareasVista>({
    queryKey: ["tareas"],
    queryFn: () => cargar(),
  });

  const refrescar = () => queryClient.invalidateQueries({ queryKey: ["tareas"] });

  const mutacionCrear = useMutation({
    mutationFn: () =>
      crear({
        data: {
          titulo: nueva.titulo.trim(),
          responsable: nueva.responsable.trim(),
          proyecto: nueva.proyecto.trim(),
          fase: nueva.fase as FaseTarea,
          detalle: nueva.detalle.trim() || undefined,
          prioridad: nueva.prioridad as "baja" | "normal" | "alta" | "critica",
          estado: "pendiente" as const,
          fechaLimite: nueva.fechaLimite || undefined,
          clientId: nueva.clientId || undefined,
        },
      }),
    onSuccess: () => {
      setNueva({
        titulo: "",
        responsable: "",
        proyecto: nueva.proyecto,
        fase: nueva.fase,
        fechaLimite: "",
        prioridad: "normal",
        clientId: "",
        detalle: "",
      });
      setAviso("Tarea creada. Crear una tarea no la ejecuta: sigue esperando trabajo humano o de un agente.");
      void refrescar();
    },
    onError: (err: Error) => setAviso(`No se ha podido crear la tarea: ${err.message}`),
  });

  const mutacionActualizar = useMutation({
    mutationFn: (variables: {
      taskId: string;
      estado?: EstadoTarea;
      fase?: FaseTarea;
      responsable?: string;
      fechaLimite?: string | null;
    }) => actualizar({ data: variables }),
    onSuccess: () => {
      setAviso("Tarea actualizada en la base de datos.");
      void refrescar();
    },
    onError: (err: Error) => setAviso(`No se ha podido actualizar la tarea: ${err.message}`),
  });

  const visibles = useMemo(() => {
    const tareas = data?.tareas ?? [];
    return tareas.filter(
      (t) =>
        (filtroEstado === "todas" || t.estado === filtroEstado) &&
        (filtroResponsable === "todos" || t.responsable === filtroResponsable) &&
        (filtroProyecto === "todos" || t.proyecto === filtroProyecto),
    );
  }, [data?.tareas, filtroEstado, filtroResponsable, filtroProyecto]);

  const proyectosVisibles = useMemo(() => {
    const proyectos = data?.proyectos ?? [];
    return filtroProyecto === "todos" ? proyectos : proyectos.filter((p) => p.proyecto === filtroProyecto);
  }, [data?.proyectos, filtroProyecto]);

  if (isPending) {
    return <div className="p-10 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Cargando tareas…</div>;
  }

  if (error || !data) {
    return (
      <div role="alert" className="p-10 text-sm text-destructive">
        No se han podido cargar las tareas.
      </div>
    );
  }

  const resumen = data.resumen;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-primary">Valme Search OS</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Seguimiento de tareas</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
              Datos de demostración
            </span>
            <Link
              to="/centro-de-mando"
              className="rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-muted-foreground/60"
            >
              Centro de mando
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8 sm:px-10">
        {aviso ? (
          <p role="status" className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground">
            {aviso}
          </p>
        ) : null}

        <section aria-labelledby="resumen">
          <h2 id="resumen" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Estado de las tareas
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { etiqueta: "Pendientes", valor: resumen.pendiente, alerta: false },
              { etiqueta: "En curso", valor: resumen.en_curso, alerta: false },
              { etiqueta: "Bloqueadas", valor: resumen.bloqueada, alerta: resumen.bloqueada > 0 },
              { etiqueta: "Fuera de plazo", valor: resumen.vencidas, alerta: resumen.vencidas > 0 },
              { etiqueta: "Completadas", valor: resumen.completada, alerta: false },
            ].map((tarjeta) => (
              <div key={tarjeta.etiqueta} className="rounded-xl border border-border bg-card p-5">
                <p className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  {tarjeta.etiqueta}
                </p>
                <p className={`mt-2 text-3xl font-semibold ${tarjeta.alerta ? "text-destructive" : "text-card-foreground"}`}>
                  {tarjeta.valor}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Una fecha límite vencida no cambia el estado por sí sola: señala que la tarea necesita una decisión.
          </p>
        </section>

        <section aria-labelledby="flujo">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="flujo" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Flujo de trabajo por proyecto
            </h2>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Proyecto
              <select
                value={filtroProyecto}
                onChange={(e) => setFiltroProyecto(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
              >
                <option value="todos">Todos</option>
                {(data.proyectos ?? []).map((p) => (
                  <option key={p.proyecto} value={p.proyecto}>
                    {p.proyecto}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Cada proyecto recorre cuatro fases. La fase indicada es la más temprana con trabajo sin completar: avanzar de
            fase es una decisión del Project Manager, no un cálculo automático.
          </p>

          <div className="mt-4 space-y-4">
            {proyectosVisibles.map((proyecto) => (
              <article key={proyecto.proyecto} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-card-foreground">{proyecto.proyecto}</h3>
                    <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                      Fase actual: {etiquetaFase[proyecto.faseActual]} · {proyecto.completadas}/{proyecto.total}{" "}
                      completadas
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {proyecto.bloqueadas > 0 ? (
                      <span className="rounded-full border border-destructive/60 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-destructive">
                        {proyecto.bloqueadas} bloqueadas
                      </span>
                    ) : null}
                    {proyecto.vencidas > 0 ? (
                      <span className="rounded-full border border-destructive/60 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-destructive">
                        {proyecto.vencidas} fuera de plazo
                      </span>
                    ) : null}
                  </div>
                </div>

                <ol className="mt-4 grid gap-3 lg:grid-cols-4">
                  {FASES_TAREA.map((fase, indice) => {
                    const tareasFase = proyecto.fases[fase];
                    const esActual = proyecto.faseActual === fase;
                    return (
                      <li
                        key={fase}
                        className={`rounded-lg border p-4 ${esActual ? "border-primary/60 bg-primary/5" : "border-border"}`}
                      >
                        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                          Fase {indice + 1}
                          {esActual ? " · en foco" : ""}
                        </p>
                        <p className="mt-1 text-sm font-medium text-card-foreground">{etiquetaFase[fase]}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{descripcionFase[fase]}</p>
                        <ul className="mt-3 space-y-2">
                          {tareasFase.map((tarea) => (
                            <li key={tarea.id} className="text-xs text-muted-foreground">
                              <span className={tarea.estado === "completada" ? "line-through decoration-1" : ""}>
                                {tarea.titulo}
                              </span>
                              <span className="block font-mono text-[0.65rem] uppercase tracking-wider">
                                {etiquetaEstado[tarea.estado]} · {tarea.responsable}
                              </span>
                            </li>
                          ))}
                          {tareasFase.length === 0 ? (
                            <li className="text-xs text-muted-foreground">Sin tareas en esta fase.</li>
                          ) : null}
                        </ul>
                      </li>
                    );
                  })}
                </ol>
              </article>
            ))}
            {proyectosVisibles.length === 0 ? (
              <p className="rounded-xl border border-border bg-card px-4 py-5 text-sm text-muted-foreground">
                Todavía no hay proyectos con tareas.
              </p>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="nueva-tarea">
          <h2 id="nueva-tarea" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Nueva tarea
          </h2>
          <form
            className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-2"
            onSubmit={(evento) => {
              evento.preventDefault();
              setAviso(null);
              mutacionCrear.mutate();
            }}
          >
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">Tarea</span>
              <input
                required
                minLength={3}
                maxLength={160}
                value={nueva.titulo}
                onChange={(e) => setNueva((prev) => ({ ...prev, titulo: e.target.value }))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
                placeholder="Revisar informe mensual de Hotel Marfil"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">Proyecto</span>
              <input
                required
                minLength={2}
                maxLength={120}
                list="proyectos"
                value={nueva.proyecto}
                onChange={(e) => setNueva((prev) => ({ ...prev, proyecto: e.target.value }))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
                placeholder="Hotel Marfil · SEO local"
              />
              <datalist id="proyectos">
                {(data.proyectos ?? []).map((p) => (
                  <option key={p.proyecto} value={p.proyecto} />
                ))}
              </datalist>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">Fase</span>
              <select
                value={nueva.fase}
                onChange={(e) => setNueva((prev) => ({ ...prev, fase: e.target.value }))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
              >
                {FASES_TAREA.map((fase) => (
                  <option key={fase} value={fase}>
                    {etiquetaFase[fase]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">Responsable</span>
              <input
                required
                minLength={2}
                maxLength={80}
                list="responsables"
                value={nueva.responsable}
                onChange={(e) => setNueva((prev) => ({ ...prev, responsable: e.target.value }))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
                placeholder="Juan (PM)"
              />
              <datalist id="responsables">
                {data.responsables.map((nombre) => (
                  <option key={nombre} value={nombre} />
                ))}
              </datalist>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">Fecha límite</span>
              <input
                type="date"
                value={nueva.fechaLimite}
                onChange={(e) => setNueva((prev) => ({ ...prev, fechaLimite: e.target.value }))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">Prioridad</span>
              <select
                value={nueva.prioridad}
                onChange={(e) => setNueva((prev) => ({ ...prev, prioridad: e.target.value }))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
              >
                {Object.entries(etiquetaPrioridad).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                Cliente (opcional)
              </span>
              <select
                value={nueva.clientId}
                onChange={(e) => setNueva((prev) => ({ ...prev, clientId: e.target.value }))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
              >
                <option value="">Sin cliente</option>
                {data.clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                Detalle (opcional)
              </span>
              <textarea
                rows={2}
                maxLength={600}
                value={nueva.detalle}
                onChange={(e) => setNueva((prev) => ({ ...prev, detalle: e.target.value }))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
                placeholder="Contexto, evidencia o condición para darla por hecha."
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={mutacionCrear.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-60"
              >
                {mutacionCrear.isPending ? "Guardando…" : "Crear tarea"}
              </button>
            </div>
          </form>
        </section>

        <section aria-labelledby="listado">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="listado" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Listado de tareas
            </h2>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Estado
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as "todas" | EstadoTarea)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
                >
                  <option value="todas">Todos</option>
                  {Object.entries(etiquetaEstado).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Responsable
                <select
                  value={filtroResponsable}
                  onChange={(e) => setFiltroResponsable(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
                >
                  <option value="todos">Todos</option>
                  {data.responsables.map((nombre) => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {visibles.map((tarea) => {
              const vencida = estaVencida(tarea);
              return (
                <li key={tarea.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-[16rem] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider ${estilosEstado[tarea.estado]}`}
                        >
                          {etiquetaEstado[tarea.estado]}
                        </span>
                        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                          {etiquetaPrioridad[tarea.prioridad] ?? tarea.prioridad}
                        </span>
                        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                          {etiquetaFase[tarea.fase]}
                        </span>
                        {vencida ? (
                          <span className="rounded-full border border-destructive/60 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-destructive">
                            Fuera de plazo
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-medium text-card-foreground">{tarea.titulo}</p>
                      {tarea.detalle ? <p className="mt-1 text-xs text-muted-foreground">{tarea.detalle}</p> : null}
                      <p className="mt-2 font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                        {tarea.proyecto} · {tarea.responsable} · {formatoFecha(tarea.fecha_limite)}
                        {tarea.cliente ? ` · ${tarea.cliente}` : ""}
                        {tarea.agente ? ` · ${tarea.agente}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`estado-${tarea.id}`}>
                        Estado de {tarea.titulo}
                      </label>
                      <select
                        id={`estado-${tarea.id}`}
                        value={tarea.estado}
                        disabled={mutacionActualizar.isPending}
                        onChange={(e) => {
                          setAviso(null);
                          mutacionActualizar.mutate({ taskId: tarea.id, estado: e.target.value as EstadoTarea });
                        }}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
                      >
                        {Object.entries(etiquetaEstado).map(([valor, etiqueta]) => (
                          <option key={valor} value={valor}>
                            {etiqueta}
                          </option>
                        ))}
                      </select>

                      <label className="sr-only" htmlFor={`fase-${tarea.id}`}>
                        Fase de {tarea.titulo}
                      </label>
                      <select
                        id={`fase-${tarea.id}`}
                        value={tarea.fase}
                        disabled={mutacionActualizar.isPending}
                        onChange={(e) => {
                          setAviso(null);
                          mutacionActualizar.mutate({ taskId: tarea.id, fase: e.target.value as FaseTarea });
                        }}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
                      >
                        {FASES_TAREA.map((fase) => (
                          <option key={fase} value={fase}>
                            {etiquetaFase[fase]}
                          </option>
                        ))}
                      </select>

                      <label className="sr-only" htmlFor={`fecha-${tarea.id}`}>
                        Fecha límite de {tarea.titulo}
                      </label>
                      <input
                        id={`fecha-${tarea.id}`}
                        type="date"
                        defaultValue={paraInput(tarea.fecha_limite)}
                        disabled={mutacionActualizar.isPending}
                        onChange={(e) => {
                          setAviso(null);
                          mutacionActualizar.mutate({ taskId: tarea.id, fechaLimite: e.target.value || null });
                        }}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring"
                      />
                    </div>
                  </div>
                </li>
              );
            })}
            {visibles.length === 0 ? (
              <li className="rounded-xl border border-border bg-card px-4 py-5 text-sm text-muted-foreground">
                No hay tareas con estos filtros.
              </li>
            ) : null}
          </ul>
        </section>
      </main>
    </div>
  );
}
