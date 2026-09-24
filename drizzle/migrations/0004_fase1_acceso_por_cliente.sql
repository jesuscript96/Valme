CREATE TYPE public.valme_role AS ENUM ('super_admin','project_manager','equipo','cliente');

CREATE TABLE public.user_access (
  user_id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text,
  role public.valme_role NOT NULL,
  status text NOT NULL DEFAULT 'invitado',
  full_portfolio boolean NOT NULL DEFAULT false,
  invited_by uuid,
  invited_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_access TO authenticated;
GRANT ALL ON public.user_access TO service_role;
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_client_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_access(user_id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role public.valme_role NOT NULL,
  status text NOT NULL DEFAULT 'activo',
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id)
);
GRANT SELECT ON public.user_client_access TO authenticated;
GRANT ALL ON public.user_client_access TO service_role;
ALTER TABLE public.user_client_access ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  client_id uuid,
  target_user_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.valida_estados_acceso() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'user_access' AND NEW.status NOT IN ('invitado','activo','desactivado') THEN
    RAISE EXCEPTION 'Estado de usuario no válido: %', NEW.status;
  END IF;
  IF TG_TABLE_NAME = 'user_client_access' AND NEW.status NOT IN ('activo','retirado') THEN
    RAISE EXCEPTION 'Estado de acceso no válido: %', NEW.status;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;
CREATE TRIGGER user_access_valida BEFORE INSERT OR UPDATE ON public.user_access FOR EACH ROW EXECUTE FUNCTION public.valida_estados_acceso();
CREATE TRIGGER user_client_access_valida BEFORE INSERT OR UPDATE ON public.user_client_access FOR EACH ROW EXECUTE FUNCTION public.valida_estados_acceso();

-- Registro append-only: nadie puede modificar ni borrar
CREATE OR REPLACE FUNCTION public.activity_events_inmutable() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'El registro de actividad no se puede modificar ni borrar'; END; $$;
CREATE TRIGGER activity_events_no_cambios BEFORE UPDATE OR DELETE ON public.activity_events FOR EACH ROW EXECUTE FUNCTION public.activity_events_inmutable();

CREATE OR REPLACE FUNCTION public.current_valme_role() RETURNS public.valme_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_access WHERE user_id = auth.uid() AND status = 'activo'
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(public.current_valme_role() = 'super_admin', false)
$$;

CREATE OR REPLACE FUNCTION public.is_internal() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(public.current_valme_role() IN ('super_admin','project_manager','equipo'), false)
$$;

CREATE OR REPLACE FUNCTION public.can_manage_clients() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(public.current_valme_role() IN ('super_admin','project_manager'), false)
$$;

CREATE OR REPLACE FUNCTION public.has_client_access(_client_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _client_id IS NULL THEN false
    WHEN public.is_super_admin() THEN true
    WHEN EXISTS (SELECT 1 FROM public.user_access ua WHERE ua.user_id = auth.uid() AND ua.status = 'activo'
                 AND ua.role = 'project_manager' AND ua.full_portfolio) THEN true
    ELSE EXISTS (
      SELECT 1 FROM public.user_client_access uca
      JOIN public.user_access ua ON ua.user_id = uca.user_id
      WHERE uca.user_id = auth.uid() AND uca.client_id = _client_id
        AND uca.status = 'activo' AND ua.status = 'activo')
  END
$$;

-- Compatibilidad: is_equipo pasa a significar "usuario interno activo"
CREATE OR REPLACE FUNCTION public.is_equipo() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_internal()
$$;

-- Políticas de las tablas nuevas
CREATE POLICY "Ver el propio acceso o todo si super admin" ON public.user_access FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Ver asignaciones propias o todas si super admin" ON public.user_client_access FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Super admin lee toda la actividad; cada cual la suya" ON public.activity_events FOR SELECT TO authenticated
  USING (public.is_super_admin() OR actor_id = auth.uid());
CREATE POLICY "Registrar eventos de sesión propios" ON public.activity_events FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND action IN ('login_password_success','login_google_success','login_google_denied','login_password_denied','logout'));

-- Reescritura de políticas existentes con aislamiento por cliente
DROP POLICY IF EXISTS "Equipo puede leer clientes" ON public.clients;
DROP POLICY IF EXISTS "Equipo puede crear clientes" ON public.clients;
DROP POLICY IF EXISTS "Equipo puede actualizar clientes" ON public.clients;
CREATE POLICY "Leer clientes con acceso" ON public.clients FOR SELECT TO authenticated USING (public.has_client_access(id));
CREATE POLICY "Crear clientes: super admin o PM" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.can_manage_clients());
CREATE POLICY "Actualizar clientes con acceso interno" ON public.clients FOR UPDATE TO authenticated
  USING (public.can_manage_clients() AND public.has_client_access(id)) WITH CHECK (public.can_manage_clients() AND public.has_client_access(id));

DROP POLICY IF EXISTS "Equipo puede leer agentes" ON public.agents;
DROP POLICY IF EXISTS "Equipo puede actualizar agentes" ON public.agents;
CREATE POLICY "Internos leen agentes" ON public.agents FOR SELECT TO authenticated USING (public.is_internal());
CREATE POLICY "Super admin o PM actualizan agentes" ON public.agents FOR UPDATE TO authenticated USING (public.can_manage_clients()) WITH CHECK (public.can_manage_clients());

DROP POLICY IF EXISTS "Equipo puede leer aprobaciones" ON public.approvals;
DROP POLICY IF EXISTS "Equipo puede crear aprobaciones" ON public.approvals;
DROP POLICY IF EXISTS "Equipo puede actualizar aprobaciones" ON public.approvals;
CREATE POLICY "Leer aprobaciones del cliente" ON public.approvals FOR SELECT TO authenticated USING (public.has_client_access(client_id));
CREATE POLICY "Internos crean aprobaciones del cliente" ON public.approvals FOR INSERT TO authenticated WITH CHECK (public.is_internal() AND public.has_client_access(client_id));
CREATE POLICY "Super admin o PM deciden aprobaciones" ON public.approvals FOR UPDATE TO authenticated
  USING (public.can_manage_clients() AND public.has_client_access(client_id)) WITH CHECK (public.can_manage_clients() AND public.has_client_access(client_id));

DROP POLICY IF EXISTS "Equipo puede leer decisiones" ON public.decisions;
DROP POLICY IF EXISTS "Equipo puede registrar decisiones" ON public.decisions;
CREATE POLICY "Internos leen decisiones del cliente" ON public.decisions FOR SELECT TO authenticated
  USING (public.is_internal() AND EXISTS (SELECT 1 FROM public.approvals a WHERE a.id = approval_id AND public.has_client_access(a.client_id)));
CREATE POLICY "Super admin o PM registran decisiones" ON public.decisions FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_clients() AND decidido_por = auth.uid()
    AND EXISTS (SELECT 1 FROM public.approvals a WHERE a.id = approval_id AND public.has_client_access(a.client_id)));

DROP POLICY IF EXISTS "Equipo puede leer actividad" ON public.activity;
DROP POLICY IF EXISTS "Equipo puede registrar actividad" ON public.activity;
CREATE POLICY "Internos leen actividad del cliente" ON public.activity FOR SELECT TO authenticated USING (public.is_internal() AND public.has_client_access(client_id));
CREATE POLICY "Internos registran actividad del cliente" ON public.activity FOR INSERT TO authenticated WITH CHECK (public.is_internal() AND public.has_client_access(client_id));

DROP POLICY IF EXISTS "Equipo puede leer tareas" ON public.tasks;
DROP POLICY IF EXISTS "Equipo puede crear tareas" ON public.tasks;
DROP POLICY IF EXISTS "Equipo puede actualizar tareas" ON public.tasks;
CREATE POLICY "Leer tareas del cliente" ON public.tasks FOR SELECT TO authenticated USING (public.has_client_access(client_id));
CREATE POLICY "Internos crean tareas del cliente" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_internal() AND public.has_client_access(client_id) AND created_by = auth.uid());
CREATE POLICY "Internos actualizan tareas del cliente" ON public.tasks FOR UPDATE TO authenticated
  USING (public.is_internal() AND public.has_client_access(client_id)) WITH CHECK (public.is_internal() AND public.has_client_access(client_id));