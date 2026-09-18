CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  detalle TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  responsable TEXT NOT NULL,
  agent_id UUID REFERENCES public.agents(id),
  client_id UUID REFERENCES public.clients(id),
  prioridad TEXT NOT NULL DEFAULT 'normal',
  fecha_limite TIMESTAMPTZ,
  completada_en TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tasks_estado_fecha_idx ON public.tasks (estado, fecha_limite);

GRANT SELECT, INSERT, UPDATE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipo puede leer tareas" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipo puede crear tareas" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Equipo puede actualizar tareas" ON public.tasks FOR UPDATE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.tasks_validar()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.estado NOT IN ('pendiente', 'en_curso', 'bloqueada', 'completada') THEN
    RAISE EXCEPTION 'Estado de tarea no válido: %', NEW.estado;
  END IF;
  IF NEW.prioridad NOT IN ('baja', 'normal', 'alta', 'critica') THEN
    RAISE EXCEPTION 'Prioridad no válida: %', NEW.prioridad;
  END IF;
  IF NEW.estado = 'completada' AND NEW.completada_en IS NULL THEN
    NEW.completada_en := now();
  END IF;
  IF NEW.estado <> 'completada' THEN
    NEW.completada_en := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_validar_trg
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.tasks_validar();