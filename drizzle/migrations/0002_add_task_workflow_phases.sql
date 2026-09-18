ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS proyecto TEXT,
  ADD COLUMN IF NOT EXISTS fase TEXT NOT NULL DEFAULT 'planificacion',
  ADD COLUMN IF NOT EXISTS orden_fase INTEGER NOT NULL DEFAULT 0;

UPDATE public.tasks t
SET proyecto = COALESCE(t.proyecto, c.nombre, 'Interno VALME')
FROM public.clients c
WHERE c.id = t.client_id;

UPDATE public.tasks
SET proyecto = 'Interno VALME'
WHERE proyecto IS NULL;

UPDATE public.tasks
SET fase = CASE
  WHEN estado = 'completada' THEN 'entrega'
  WHEN estado = 'en_curso' THEN 'desarrollo'
  WHEN estado = 'bloqueada' THEN 'revision'
  ELSE 'planificacion'
END;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_fase_valida
  CHECK (fase IN ('planificacion', 'desarrollo', 'revision', 'entrega'));

CREATE INDEX IF NOT EXISTS tasks_proyecto_fase_idx ON public.tasks (proyecto, fase);