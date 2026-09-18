import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ESTADOS_TAREA = ["pendiente", "en_curso", "bloqueada", "completada"] as const;
export const PRIORIDADES_TAREA = ["baja", "normal", "alta", "critica"] as const;
export const FASES_TAREA = ["planificacion", "desarrollo", "revision", "entrega"] as const;

export type EstadoTarea = (typeof ESTADOS_TAREA)[number];
export type PrioridadTarea = (typeof PRIORIDADES_TAREA)[number];
export type FaseTarea = (typeof FASES_TAREA)[number];

export type Tarea = {
  id: string;
  titulo: string;
  detalle: string | null;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  fase: FaseTarea;
  proyecto: string;
  responsable: string;
  fecha_limite: string | null;
  completada_en: string | null;
  created_at: string;
  cliente: string | null;
  agente: string | null;
};

export type ProyectoFlujo = {
  proyecto: string;
  total: number;
  completadas: number;
  bloqueadas: number;
  vencidas: number;
  faseActual: FaseTarea;
  fases: Record<FaseTarea, Tarea[]>;
};

export type TareasResumen = {
  total: number;
  pendiente: number;
  en_curso: number;
  bloqueada: number;
  completada: number;
  vencidas: number;
};

export type TareasVista = {
  tareas: Tarea[];
  resumen: TareasResumen;
  responsables: string[];
  proyectos: ProyectoFlujo[];
  clientes: Array<{ id: string; nombre: string }>;
  agentes: Array<{ id: string; nombre: string; especialidad: string }>;
};

type FilaTarea = {
  id: string;
  titulo: string;
  detalle: string | null;
  estado: string;
  prioridad: string;
  fase: string;
  proyecto: string | null;
  responsable: string;
  fecha_limite: string | null;
  completada_en: string | null;
  created_at: string;
  clients: { nombre: string } | null;
  agents: { nombre: string } | null;
};

function fasesVacias(): Record<FaseTarea, Tarea[]> {
  return { planificacion: [], desarrollo: [], revision: [], entrega: [] };
}

// La fase actual del proyecto es la más temprana con trabajo sin completar:
// avanzar de fase es una decisión del Project Manager, no un cálculo automático.
function calcularFaseActual(fases: Record<FaseTarea, Tarea[]>): FaseTarea {
  for (const fase of FASES_TAREA) {
    if (fases[fase].some((t) => t.estado !== "completada")) return fase;
  }
  return "entrega";
}

function agruparProyectos(tareas: Tarea[]): ProyectoFlujo[] {
  const mapa = new Map<string, Tarea[]>();
  for (const tarea of tareas) {
    const lista = mapa.get(tarea.proyecto) ?? [];
    lista.push(tarea);
    mapa.set(tarea.proyecto, lista);
  }
  const ahora = Date.now();
  return Array.from(mapa.entries())
    .map(([proyecto, lista]) => {
      const fases = fasesVacias();
      for (const tarea of lista) fases[tarea.fase].push(tarea);
      return {
        proyecto,
        total: lista.length,
        completadas: lista.filter((t) => t.estado === "completada").length,
        bloqueadas: lista.filter((t) => t.estado === "bloqueada").length,
        vencidas: lista.filter(
          (t) => t.estado !== "completada" && t.fecha_limite && new Date(t.fecha_limite).getTime() < ahora,
        ).length,
        faseActual: calcularFaseActual(fases),
        fases,
      };
    })
    .sort((a, b) => a.proyecto.localeCompare(b.proyecto, "es"));
}

export const getTareas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TareasVista> => {
    const supabase = context.supabase;

    const [tareasRes, clientesRes, agentesRes] = await Promise.all([
      supabase
        .from("tasks")
        .select(
          "id, titulo, detalle, estado, prioridad, fase, proyecto, responsable, fecha_limite, completada_en, created_at, clients(nombre), agents(nombre)",
        )
        .order("fecha_limite", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, nombre").order("nombre", { ascending: true }).limit(200),
      supabase.from("agents").select("id, nombre, especialidad").order("nombre", { ascending: true }),
    ]);

    const error = tareasRes.error ?? clientesRes.error ?? agentesRes.error;
    if (error) throw new Error(error.message);

    const filas = (tareasRes.data ?? []) as unknown as FilaTarea[];
    const tareas: Tarea[] = filas.map((fila) => ({
      id: fila.id,
      titulo: fila.titulo,
      detalle: fila.detalle,
      estado: fila.estado as EstadoTarea,
      prioridad: fila.prioridad as PrioridadTarea,
      responsable: fila.responsable,
      fecha_limite: fila.fecha_limite,
      completada_en: fila.completada_en,
      created_at: fila.created_at,
      cliente: fila.clients?.nombre ?? null,
      agente: fila.agents?.nombre ?? null,
    }));

    const ahora = Date.now();
    const contar = (estado: EstadoTarea) => tareas.filter((t) => t.estado === estado).length;

    return {
      tareas,
      resumen: {
        total: tareas.length,
        pendiente: contar("pendiente"),
        en_curso: contar("en_curso"),
        bloqueada: contar("bloqueada"),
        completada: contar("completada"),
        // Una fecha límite vencida no cambia el estado por sí sola: sólo señala
        // que la tarea necesita una decisión del Project Manager.
        vencidas: tareas.filter(
          (t) => t.estado !== "completada" && t.fecha_limite && new Date(t.fecha_limite).getTime() < ahora,
        ).length,
      },
      responsables: Array.from(new Set(tareas.map((t) => t.responsable))).sort((a, b) => a.localeCompare(b, "es")),
      clientes: clientesRes.data ?? [],
      agentes: agentesRes.data ?? [],
    };
  });

const nuevaTareaSchema = z.object({
  titulo: z.string().trim().min(3).max(160),
  detalle: z.string().trim().max(600).optional(),
  responsable: z.string().trim().min(2).max(80),
  estado: z.enum(ESTADOS_TAREA).default("pendiente"),
  prioridad: z.enum(PRIORIDADES_TAREA).default("normal"),
  fechaLimite: z.string().trim().min(1).optional(),
  clientId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
});

export const crearTarea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => nuevaTareaSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tasks").insert({
      titulo: data.titulo,
      detalle: data.detalle ?? null,
      responsable: data.responsable,
      estado: data.estado,
      prioridad: data.prioridad,
      fecha_limite: data.fechaLimite ? new Date(data.fechaLimite).toISOString() : null,
      client_id: data.clientId ?? null,
      agent_id: data.agentId ?? null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const actualizarTareaSchema = z.object({
  taskId: z.string().uuid(),
  estado: z.enum(ESTADOS_TAREA).optional(),
  responsable: z.string().trim().min(2).max(80).optional(),
  fechaLimite: z.string().trim().nullable().optional(),
});

export const actualizarTarea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => actualizarTareaSchema.parse(data))
  .handler(async ({ data, context }) => {
    const cambios: {
      estado?: string;
      responsable?: string;
      fecha_limite?: string | null;
    } = {};
    if (data.estado) cambios.estado = data.estado;
    if (data.responsable) cambios.responsable = data.responsable;
    if (data.fechaLimite !== undefined) {
      cambios.fecha_limite = data.fechaLimite ? new Date(data.fechaLimite).toISOString() : null;
    }
    if (Object.keys(cambios).length === 0) return { ok: true };

    const { error } = await context.supabase.from("tasks").update(cambios).eq("id", data.taskId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
