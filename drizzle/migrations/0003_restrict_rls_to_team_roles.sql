-- Roles de equipo en tabla separada (nunca en profiles)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'equipo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cada usuario ve sus roles" ON public.user_roles;
CREATE POLICY "Cada usuario ve sus roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_equipo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'equipo') OR public.has_role(auth.uid(), 'admin')
$$;

-- clients
DROP POLICY IF EXISTS "Equipo puede leer clientes" ON public.clients;
DROP POLICY IF EXISTS "Equipo puede crear clientes" ON public.clients;
DROP POLICY IF EXISTS "Equipo puede actualizar clientes" ON public.clients;
CREATE POLICY "Equipo puede leer clientes" ON public.clients
  FOR SELECT TO authenticated USING (public.is_equipo());
CREATE POLICY "Equipo puede crear clientes" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (public.is_equipo());
CREATE POLICY "Equipo puede actualizar clientes" ON public.clients
  FOR UPDATE TO authenticated USING (public.is_equipo()) WITH CHECK (public.is_equipo());

-- agents
DROP POLICY IF EXISTS "Equipo puede leer agentes" ON public.agents;
DROP POLICY IF EXISTS "Equipo puede actualizar agentes" ON public.agents;
CREATE POLICY "Equipo puede leer agentes" ON public.agents
  FOR SELECT TO authenticated USING (public.is_equipo());
CREATE POLICY "Equipo puede actualizar agentes" ON public.agents
  FOR UPDATE TO authenticated USING (public.is_equipo()) WITH CHECK (public.is_equipo());

-- approvals
DROP POLICY IF EXISTS "Equipo puede leer aprobaciones" ON public.approvals;
DROP POLICY IF EXISTS "Equipo puede crear aprobaciones" ON public.approvals;
DROP POLICY IF EXISTS "Equipo puede actualizar aprobaciones" ON public.approvals;
CREATE POLICY "Equipo puede leer aprobaciones" ON public.approvals
  FOR SELECT TO authenticated USING (public.is_equipo());
CREATE POLICY "Equipo puede crear aprobaciones" ON public.approvals
  FOR INSERT TO authenticated WITH CHECK (public.is_equipo());
CREATE POLICY "Equipo puede actualizar aprobaciones" ON public.approvals
  FOR UPDATE TO authenticated USING (public.is_equipo()) WITH CHECK (public.is_equipo());

-- decisions
DROP POLICY IF EXISTS "Equipo puede leer decisiones" ON public.decisions;
DROP POLICY IF EXISTS "Equipo puede registrar decisiones" ON public.decisions;
CREATE POLICY "Equipo puede leer decisiones" ON public.decisions
  FOR SELECT TO authenticated USING (public.is_equipo());
CREATE POLICY "Equipo puede registrar decisiones" ON public.decisions
  FOR INSERT TO authenticated WITH CHECK (public.is_equipo() AND decidido_por = auth.uid());

-- activity
DROP POLICY IF EXISTS "Equipo puede leer actividad" ON public.activity;
DROP POLICY IF EXISTS "Equipo puede registrar actividad" ON public.activity;
CREATE POLICY "Equipo puede leer actividad" ON public.activity
  FOR SELECT TO authenticated USING (public.is_equipo());
CREATE POLICY "Equipo puede registrar actividad" ON public.activity
  FOR INSERT TO authenticated WITH CHECK (public.is_equipo());

-- tasks
DROP POLICY IF EXISTS "Equipo puede leer tareas" ON public.tasks;
DROP POLICY IF EXISTS "Equipo puede crear tareas" ON public.tasks;
DROP POLICY IF EXISTS "Equipo puede actualizar tareas" ON public.tasks;
CREATE POLICY "Equipo puede leer tareas" ON public.tasks
  FOR SELECT TO authenticated USING (public.is_equipo());
CREATE POLICY "Equipo puede crear tareas" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (public.is_equipo() AND created_by = auth.uid());
CREATE POLICY "Equipo puede actualizar tareas" ON public.tasks
  FOR UPDATE TO authenticated USING (public.is_equipo()) WITH CHECK (public.is_equipo());
