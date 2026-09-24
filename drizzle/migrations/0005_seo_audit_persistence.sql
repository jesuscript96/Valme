-- Persistencia multi-tenant para auditorias SEO.
-- Esta migracion no almacena secretos: seo_audit_access_refs solo contiene referencias opacas.

DO $$ BEGIN
  CREATE TYPE public.tenant_role AS ENUM ('owner', 'manager', 'member', 'reviewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.seo_audit_state AS ENUM (
    'borrador',
    'pendiente_autorizacion',
    'autorizado',
    'en_cola',
    'en_ejecucion',
    'bloqueado',
    'control_calidad',
    'devuelto',
    'validado',
    'cancelado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.seo_access_state AS ENUM (
    'no_solicitado', 'pendiente', 'validado', 'insuficiente', 'caducado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.seo_finding_state AS ENUM (
    'propuesto', 'bloqueado', 'devuelto', 'validado', 'descartado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.seo_result_type AS ENUM (
    'medicion', 'observacion', 'estimacion', 'heuristica'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.seo_confidence_level AS ENUM ('baja', 'media', 'alta');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.seo_priority AS ENUM ('baja', 'media', 'alta', 'critica');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.seo_coverage_state AS ENUM (
    'evidencia_suficiente',
    'cobertura_parcial',
    'bloqueo_por_acceso',
    'ausencia_declarada',
    'pendiente_justificado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE public.tenant_memberships (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.tenant_role NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX tenant_memberships_user_idx
  ON public.tenant_memberships (user_id, tenant_id);

-- Compatibilidad con los datos ficticios existentes. No se usa como default para datos nuevos.
INSERT INTO public.tenants (id, nombre, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'VALME Demo', 'valme-demo')
ON CONFLICT (id) DO NOTHING;

-- Las membresias del tenant de demostracion derivan de public.user_access,
-- la unica fuente de autorizacion desde la Fase 1 de seguridad.
-- Solo usuarios activos y solo roles internos: invitados, desactivados y el rol
-- cliente nunca entran en el tenant. Un trigger mantiene la sincronizacion despues.
INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
SELECT
  '00000000-0000-0000-0000-000000000001',
  ua.user_id,
  CASE ua.role
    WHEN 'super_admin'::public.valme_role THEN 'owner'::public.tenant_role
    WHEN 'project_manager'::public.valme_role THEN 'manager'::public.tenant_role
    WHEN 'equipo'::public.valme_role THEN 'member'::public.tenant_role
  END
FROM public.user_access ua
WHERE ua.status = 'activo'
  AND ua.role IN ('super_admin', 'project_manager', 'equipo')
ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;

-- Sincronizacion continua: altas, activaciones, desactivaciones, cambios de rol y bajas.
CREATE OR REPLACE FUNCTION public.seo_sync_demo_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _demo constant uuid := '00000000-0000-0000-0000-000000000001';
  _role public.tenant_role;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.tenant_memberships WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;

  _role := CASE
    WHEN NEW.status <> 'activo' THEN NULL
    WHEN NEW.role = 'super_admin' THEN 'owner'::public.tenant_role
    WHEN NEW.role = 'project_manager' THEN 'manager'::public.tenant_role
    WHEN NEW.role = 'equipo' THEN 'member'::public.tenant_role
    ELSE NULL
  END;

  IF _role IS NULL THEN
    DELETE FROM public.tenant_memberships WHERE tenant_id = _demo AND user_id = NEW.user_id;
  ELSE
    INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
    VALUES (_demo, NEW.user_id, _role)
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.seo_sync_demo_membership() FROM PUBLIC;

CREATE TRIGGER user_access_sync_demo_membership
AFTER INSERT OR UPDATE OF role, status OR DELETE ON public.user_access
FOR EACH ROW EXECUTE FUNCTION public.seo_sync_demo_membership();

ALTER TABLE public.clients ADD COLUMN tenant_id uuid;

UPDATE public.clients
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

ALTER TABLE public.clients
  ALTER COLUMN tenant_id SET NOT NULL,
  ADD CONSTRAINT clients_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT,
  ADD CONSTRAINT clients_id_tenant_unique UNIQUE (id, tenant_id);

CREATE INDEX clients_tenant_idx ON public.clients (tenant_id, created_at DESC);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL,
  nombre text NOT NULL,
  primary_domain text NOT NULL,
  estado text NOT NULL DEFAULT 'activo',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_estado_valid CHECK (estado IN ('activo', 'pausado', 'cerrado')),
  CONSTRAINT projects_client_tenant_fk
    FOREIGN KEY (client_id, tenant_id)
    REFERENCES public.clients(id, tenant_id)
    ON DELETE RESTRICT,
  CONSTRAINT projects_id_tenant_client_unique UNIQUE (id, tenant_id, client_id),
  CONSTRAINT projects_id_tenant_unique UNIQUE (id, tenant_id)
);

CREATE INDEX projects_tenant_client_idx
  ON public.projects (tenant_id, client_id, created_at DESC);

CREATE TABLE public.seo_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL,
  project_id uuid NOT NULL,
  service_ids text[] NOT NULL,
  requested_by uuid NOT NULL,
  authorized_by uuid,
  authorization_ref text,
  primary_domain text NOT NULL,
  seed_urls text[] NOT NULL,
  markets text[] NOT NULL,
  languages text[] NOT NULL,
  authorized_scope jsonb NOT NULL,
  requested_capability_ids text[] NOT NULL,
  max_pages integer NOT NULL,
  max_duration_minutes integer NOT NULL,
  max_cost_amount numeric(12, 2) NOT NULL,
  currency text NOT NULL,
  contract_version text NOT NULL,
  state public.seo_audit_state NOT NULL DEFAULT 'borrador',
  transition_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seo_audits_project_scope_fk
    FOREIGN KEY (project_id, tenant_id, client_id)
    REFERENCES public.projects(id, tenant_id, client_id)
    ON DELETE RESTRICT,
  CONSTRAINT seo_audits_id_tenant_unique UNIQUE (id, tenant_id),
  CONSTRAINT seo_audits_nonempty_services CHECK (cardinality(service_ids) > 0),
  CONSTRAINT seo_audits_nonempty_seeds CHECK (cardinality(seed_urls) > 0),
  CONSTRAINT seo_audits_nonempty_markets CHECK (cardinality(markets) > 0),
  CONSTRAINT seo_audits_nonempty_languages CHECK (cardinality(languages) > 0),
  CONSTRAINT seo_audits_nonempty_capabilities CHECK (cardinality(requested_capability_ids) > 0),
  CONSTRAINT seo_audits_scope_object CHECK (jsonb_typeof(authorized_scope) = 'object'),
  CONSTRAINT seo_audits_limits_valid CHECK (
    max_pages > 0 AND max_duration_minutes > 0 AND max_cost_amount >= 0
  ),
  CONSTRAINT seo_audits_currency_valid CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT seo_audits_authorization_complete CHECK (
    state NOT IN (
      'autorizado', 'en_cola', 'en_ejecucion', 'bloqueado', 'control_calidad', 'validado'
    )
    OR (authorized_by IS NOT NULL AND authorization_ref IS NOT NULL)
  )
);

CREATE INDEX seo_audits_tenant_project_state_idx
  ON public.seo_audits (tenant_id, project_id, state, created_at DESC);
CREATE INDEX seo_audits_tenant_client_idx
  ON public.seo_audits (tenant_id, client_id, created_at DESC);

CREATE TABLE public.seo_audit_access_refs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  audit_id uuid NOT NULL,
  access_ref text NOT NULL,
  kind text NOT NULL,
  required_for_capability_ids text[] NOT NULL DEFAULT '{}',
  state public.seo_access_state NOT NULL DEFAULT 'no_solicitado',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seo_access_refs_audit_fk
    FOREIGN KEY (audit_id, tenant_id)
    REFERENCES public.seo_audits(id, tenant_id)
    ON DELETE CASCADE,
  CONSTRAINT seo_access_refs_identity_unique UNIQUE (tenant_id, audit_id, access_ref),
  CONSTRAINT seo_access_refs_kind_safe CHECK (
    kind !~* '(secret|password|token|credential|api[_ -]?key)'
  )
);

CREATE INDEX seo_access_refs_audit_state_idx
  ON public.seo_audit_access_refs (tenant_id, audit_id, state);

CREATE TABLE public.seo_audit_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  audit_id uuid NOT NULL,
  url_or_resource text NOT NULL,
  source text NOT NULL,
  observed_at timestamptz NOT NULL,
  collection_method text NOT NULL,
  observed_data text NOT NULL,
  artifact_ref text,
  integrity_hash text,
  contains_external_untrusted_data boolean NOT NULL DEFAULT true,
  measurement_from timestamptz,
  measurement_to timestamptz,
  device text,
  market text,
  language text,
  level text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seo_evidence_audit_fk
    FOREIGN KEY (audit_id, tenant_id)
    REFERENCES public.seo_audits(id, tenant_id)
    ON DELETE RESTRICT,
  CONSTRAINT seo_evidence_id_scope_unique UNIQUE (id, tenant_id, audit_id),
  CONSTRAINT seo_evidence_measurement_period_valid CHECK (
    (measurement_from IS NULL AND measurement_to IS NULL)
    OR (measurement_from IS NOT NULL AND measurement_to IS NOT NULL AND measurement_from <= measurement_to)
  ),
  CONSTRAINT seo_evidence_device_valid CHECK (
    device IS NULL OR device IN ('mobile', 'desktop', 'both', 'unknown')
  ),
  CONSTRAINT seo_evidence_level_valid CHECK (level IS NULL OR level IN ('url', 'origin'))
);

CREATE INDEX seo_evidence_audit_observed_idx
  ON public.seo_audit_evidence (tenant_id, audit_id, observed_at DESC);

CREATE TABLE public.seo_audit_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  audit_id uuid NOT NULL,
  category text NOT NULL,
  related_service_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority public.seo_priority NOT NULL,
  impact text NOT NULL,
  recommendation text NOT NULL,
  state public.seo_finding_state NOT NULL DEFAULT 'propuesto',
  result_type public.seo_result_type NOT NULL,
  confidence public.seo_confidence_level NOT NULL,
  sources text[] NOT NULL,
  observed_at timestamptz NOT NULL,
  responsible_kind text NOT NULL,
  responsible_id text NOT NULL,
  responsible_name text NOT NULL,
  depends_on_access_ref text,
  limitations text[] NOT NULL DEFAULT '{}',
  requires_human_approval boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seo_findings_audit_fk
    FOREIGN KEY (audit_id, tenant_id)
    REFERENCES public.seo_audits(id, tenant_id)
    ON DELETE RESTRICT,
  CONSTRAINT seo_findings_access_ref_fk
    FOREIGN KEY (tenant_id, audit_id, depends_on_access_ref)
    REFERENCES public.seo_audit_access_refs(tenant_id, audit_id, access_ref)
    ON DELETE RESTRICT,
  CONSTRAINT seo_findings_id_scope_unique UNIQUE (id, tenant_id, audit_id),
  CONSTRAINT seo_findings_nonempty_sources CHECK (cardinality(sources) > 0),
  CONSTRAINT seo_findings_responsible_kind_valid CHECK (responsible_kind IN ('agent', 'tool')),
  CONSTRAINT seo_findings_category_valid CHECK (category IN (
    'auditoria_completa', 'crawling', 'seo_tecnico', 'indexacion', 'sitemap',
    'robots_txt', 'canonical', 'redirects', 'core_web_vitals', 'pagespeed',
    'crux', 'search_console', 'ga4', 'schema_org', 'contenido', 'eeat',
    'keyword_research', 'semantic_clustering', 'aeo_geo_citabilidad'
  ))
);

CREATE INDEX seo_findings_audit_priority_idx
  ON public.seo_audit_findings (tenant_id, audit_id, priority, state);
CREATE INDEX seo_findings_service_idx
  ON public.seo_audit_findings (tenant_id, audit_id, related_service_id);

CREATE TABLE public.seo_finding_evidence (
  tenant_id uuid NOT NULL,
  audit_id uuid NOT NULL,
  finding_id uuid NOT NULL,
  evidence_id uuid NOT NULL,
  linked_by uuid NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, audit_id, finding_id, evidence_id),
  CONSTRAINT seo_finding_evidence_finding_fk
    FOREIGN KEY (finding_id, tenant_id, audit_id)
    REFERENCES public.seo_audit_findings(id, tenant_id, audit_id)
    ON DELETE CASCADE,
  CONSTRAINT seo_finding_evidence_evidence_fk
    FOREIGN KEY (evidence_id, tenant_id, audit_id)
    REFERENCES public.seo_audit_evidence(id, tenant_id, audit_id)
    ON DELETE RESTRICT
);

CREATE INDEX seo_finding_evidence_evidence_idx
  ON public.seo_finding_evidence (tenant_id, audit_id, evidence_id);

CREATE TABLE public.seo_service_coverage (
  tenant_id uuid NOT NULL,
  audit_id uuid NOT NULL,
  service_id text NOT NULL,
  state public.seo_coverage_state NOT NULL,
  reason text,
  declared_by uuid,
  declared_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, audit_id, service_id),
  CONSTRAINT seo_service_coverage_audit_fk
    FOREIGN KEY (audit_id, tenant_id)
    REFERENCES public.seo_audits(id, tenant_id)
    ON DELETE CASCADE,
  CONSTRAINT seo_service_coverage_declaration_valid CHECK (
    state NOT IN ('ausencia_declarada', 'pendiente_justificado')
    OR (reason IS NOT NULL AND declared_by IS NOT NULL AND declared_at IS NOT NULL)
  )
);

CREATE TABLE public.seo_audit_state_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL,
  audit_id uuid NOT NULL,
  from_state public.seo_audit_state,
  to_state public.seo_audit_state NOT NULL,
  reason text,
  actor_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seo_audit_state_events_audit_fk
    FOREIGN KEY (audit_id, tenant_id)
    REFERENCES public.seo_audits(id, tenant_id)
    ON DELETE RESTRICT
);

CREATE INDEX seo_audit_state_events_timeline_idx
  ON public.seo_audit_state_events (tenant_id, audit_id, id);

-- Rango efectivo: el menor privilegio entre el rol del tenant y el rol VALME vigente.
-- owner=4, manager=3, member=2, reviewer=1. Global: super_admin=4, project_manager=3,
-- equipo=2, cliente=1. Asi un PM degradado a equipo pierde manager en todos los tenants
-- sin tocar sus membresias, y cliente + reviewer es una combinacion valida de solo lectura.
CREATE OR REPLACE FUNCTION public.tenant_role_rank(_role public.tenant_role)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _role WHEN 'owner' THEN 4 WHEN 'manager' THEN 3 WHEN 'member' THEN 2 WHEN 'reviewer' THEN 1 ELSE 0 END
$$;

CREATE OR REPLACE FUNCTION public.valme_role_rank(_role public.valme_role)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _role WHEN 'super_admin' THEN 4 WHEN 'project_manager' THEN 3 WHEN 'equipo' THEN 2 WHEN 'cliente' THEN 1 ELSE 0 END
$$;

CREATE OR REPLACE FUNCTION public.effective_tenant_role(_tenant_id uuid)
RETURNS public.tenant_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE LEAST(public.tenant_role_rank(tm.role), public.valme_role_rank(ua.role))
    WHEN 4 THEN 'owner'::public.tenant_role
    WHEN 3 THEN 'manager'::public.tenant_role
    WHEN 2 THEN 'member'::public.tenant_role
    WHEN 1 THEN 'reviewer'::public.tenant_role
  END
  FROM public.tenant_memberships tm
  JOIN public.user_access ua ON ua.user_id = tm.user_id
  WHERE tm.tenant_id = _tenant_id
    AND tm.user_id = auth.uid()
    AND ua.status = 'activo'
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(
  _tenant_id uuid,
  _roles public.tenant_role[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.effective_tenant_role(_tenant_id) = ANY(_roles), false)
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_tenant_role(
    _tenant_id,
    ARRAY['owner', 'manager', 'member', 'reviewer']::public.tenant_role[]
  )
$$;

CREATE OR REPLACE FUNCTION public.can_contribute_to_tenant(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_tenant_role(
    _tenant_id,
    ARRAY['owner', 'manager', 'member']::public.tenant_role[]
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_tenant(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_tenant_role(
    _tenant_id,
    ARRAY['owner', 'manager']::public.tenant_role[]
  )
$$;

-- La pertenencia al tenant no basta: se exige tambien el acceso por cliente de la Fase 1.
CREATE OR REPLACE FUNCTION public.can_read_seo_audit(_tenant_id uuid, _audit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_tenant_member(_tenant_id)
    AND EXISTS (
      SELECT 1 FROM public.seo_audits a
      WHERE a.id = _audit_id
        AND a.tenant_id = _tenant_id
        AND public.has_client_access(a.client_id)
    )
$$;

CREATE OR REPLACE FUNCTION public.can_write_seo_audit(_tenant_id uuid, _audit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_contribute_to_tenant(_tenant_id)
    AND EXISTS (
      SELECT 1 FROM public.seo_audits a
      WHERE a.id = _audit_id
        AND a.tenant_id = _tenant_id
        AND a.state NOT IN ('validado', 'cancelado')
        AND public.has_client_access(a.client_id)
    )
$$;

REVOKE ALL ON FUNCTION public.effective_tenant_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.effective_tenant_role(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_tenant_role(uuid, public.tenant_role[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_contribute_to_tenant(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_tenant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, public.tenant_role[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_contribute_to_tenant(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_tenant(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.can_read_seo_audit(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_write_seo_audit(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_seo_audit(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_write_seo_audit(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.seo_audit_transition_allowed(
  _from public.seo_audit_state,
  _to public.seo_audit_state
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _from
    WHEN 'borrador' THEN _to IN ('pendiente_autorizacion', 'cancelado')
    WHEN 'pendiente_autorizacion' THEN _to IN ('autorizado', 'devuelto', 'cancelado')
    WHEN 'autorizado' THEN _to IN ('en_cola', 'en_ejecucion', 'bloqueado', 'cancelado')
    WHEN 'en_cola' THEN _to IN ('en_ejecucion', 'bloqueado', 'cancelado')
    WHEN 'en_ejecucion' THEN _to IN ('bloqueado', 'control_calidad', 'cancelado')
    WHEN 'bloqueado' THEN _to IN ('en_ejecucion', 'devuelto', 'cancelado')
    WHEN 'control_calidad' THEN _to IN ('devuelto', 'validado', 'cancelado')
    WHEN 'devuelto' THEN _to IN ('borrador', 'pendiente_autorizacion', 'cancelado')
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.seo_audit_validate_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _is_service_role boolean := COALESCE(auth.role() = 'service_role', false);
  _scope_changed boolean;
  _authorizing boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.state <> 'borrador' THEN
      RAISE EXCEPTION 'Una auditoria nueva debe comenzar en borrador';
    END IF;
    IF NEW.authorized_by IS NOT NULL OR NEW.authorization_ref IS NOT NULL THEN
      RAISE EXCEPTION 'Una auditoria nueva no puede nacer autorizada';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
    OR NEW.client_id IS DISTINCT FROM OLD.client_id
    OR NEW.project_id IS DISTINCT FROM OLD.project_id
    OR NEW.requested_by IS DISTINCT FROM OLD.requested_by THEN
    RAISE EXCEPTION 'tenant, cliente, proyecto y solicitante son inmutables';
  END IF;

  _scope_changed := (
    NEW.service_ids IS DISTINCT FROM OLD.service_ids
    OR NEW.primary_domain IS DISTINCT FROM OLD.primary_domain
    OR NEW.seed_urls IS DISTINCT FROM OLD.seed_urls
    OR NEW.markets IS DISTINCT FROM OLD.markets
    OR NEW.languages IS DISTINCT FROM OLD.languages
    OR NEW.authorized_scope IS DISTINCT FROM OLD.authorized_scope
    OR NEW.requested_capability_ids IS DISTINCT FROM OLD.requested_capability_ids
    OR NEW.max_pages IS DISTINCT FROM OLD.max_pages
    OR NEW.max_duration_minutes IS DISTINCT FROM OLD.max_duration_minutes
    OR NEW.max_cost_amount IS DISTINCT FROM OLD.max_cost_amount
    OR NEW.currency IS DISTINCT FROM OLD.currency
    OR NEW.contract_version IS DISTINCT FROM OLD.contract_version
  );
  IF OLD.state NOT IN ('borrador', 'devuelto') AND _scope_changed THEN
    RAISE EXCEPTION 'El alcance solo puede cambiar en borrador o devuelto';
  END IF;

  _authorizing := NEW.state = 'autorizado' AND OLD.state = 'pendiente_autorizacion';

  -- authorized_by y authorization_ref solo se fijan en una transicion valida a autorizado.
  IF NOT _authorizing AND (
    NEW.authorized_by IS DISTINCT FROM OLD.authorized_by
    OR NEW.authorization_ref IS DISTINCT FROM OLD.authorization_ref
  ) THEN
    RAISE EXCEPTION 'La autorizacion solo puede registrarse al pasar de pendiente_autorizacion a autorizado';
  END IF;

  -- Invalidacion: cambiar el alcance en devuelto, o volver a borrador/pendiente_autorizacion,
  -- anula la autorizacion anterior. Reanudar exige
  -- devuelto -> pendiente_autorizacion -> autorizado -> en_cola/en_ejecucion.
  IF (OLD.state = 'devuelto' AND _scope_changed)
    OR (NEW.state IN ('borrador', 'pendiente_autorizacion') AND NEW.state IS DISTINCT FROM OLD.state) THEN
    NEW.authorized_by := NULL;
    NEW.authorization_ref := NULL;
  END IF;

  IF _authorizing AND (NEW.authorized_by IS NULL OR NULLIF(BTRIM(NEW.authorization_ref), '') IS NULL) THEN
    RAISE EXCEPTION 'La autorizacion requiere authorized_by y authorization_ref';
  END IF;

  IF NEW.state IS DISTINCT FROM OLD.state THEN
    IF NOT public.seo_audit_transition_allowed(OLD.state, NEW.state) THEN
      RAISE EXCEPTION 'Transicion de auditoria no permitida: % -> %', OLD.state, NEW.state;
    END IF;

    IF NEW.state IN ('bloqueado', 'devuelto', 'cancelado')
      AND NULLIF(BTRIM(NEW.transition_reason), '') IS NULL THEN
      RAISE EXCEPTION 'La transicion a % requiere motivo', NEW.state;
    END IF;

    IF NEW.state IN ('autorizado', 'validado')
      AND NOT _is_service_role
      AND NOT public.can_manage_tenant(NEW.tenant_id) THEN
      RAISE EXCEPTION 'La transicion a % requiere rol owner o manager', NEW.state;
    END IF;

    IF NEW.state = 'autorizado'
      AND NOT _is_service_role
      AND NEW.authorized_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'authorized_by debe coincidir con el usuario autorizador';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER seo_audits_validate_write_trg
BEFORE INSERT OR UPDATE ON public.seo_audits
FOR EACH ROW EXECUTE FUNCTION public.seo_audit_validate_write();

CREATE OR REPLACE FUNCTION public.seo_record_audit_state_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.state IS DISTINCT FROM OLD.state THEN
    INSERT INTO public.seo_audit_state_events (
      tenant_id,
      audit_id,
      from_state,
      to_state,
      reason,
      actor_id
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.state END,
      NEW.state,
      NEW.transition_reason,
      COALESCE(auth.uid(), NEW.authorized_by, NEW.requested_by)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER seo_audits_record_state_trg
AFTER INSERT OR UPDATE OF state ON public.seo_audits
FOR EACH ROW EXECUTE FUNCTION public.seo_record_audit_state_event();

CREATE OR REPLACE FUNCTION public.seo_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.seo_prevent_client_tenant_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'El tenant de un cliente es inmutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER clients_tenant_immutable_trg
BEFORE UPDATE OF tenant_id ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.seo_prevent_client_tenant_change();

CREATE TRIGGER tenants_updated_at_trg
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();
CREATE TRIGGER projects_updated_at_trg
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();
CREATE TRIGGER seo_access_refs_updated_at_trg
BEFORE UPDATE ON public.seo_audit_access_refs
FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();
CREATE TRIGGER seo_findings_updated_at_trg
BEFORE UPDATE ON public.seo_audit_findings
FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();
CREATE TRIGGER seo_service_coverage_updated_at_trg
BEFORE UPDATE ON public.seo_service_coverage
FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();

-- RLS: toda lectura y escritura de auditoria se resuelve por membresia del tenant.
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_access_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_finding_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_service_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_state_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Equipo puede leer clientes" ON public.clients;
DROP POLICY IF EXISTS "Equipo puede crear clientes" ON public.clients;
DROP POLICY IF EXISTS "Equipo puede actualizar clientes" ON public.clients;
DROP POLICY IF EXISTS "Leer clientes con acceso" ON public.clients;
DROP POLICY IF EXISTS "Crear clientes: super admin o PM" ON public.clients;
DROP POLICY IF EXISTS "Actualizar clientes con acceso interno" ON public.clients;
CREATE POLICY "Miembros leen clientes de su tenant" ON public.clients
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) AND public.has_client_access(id));
CREATE POLICY "Managers crean clientes de su tenant" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_tenant(tenant_id) AND public.can_manage_clients());
CREATE POLICY "Managers actualizan clientes de su tenant" ON public.clients
  FOR UPDATE TO authenticated
  USING (public.can_manage_tenant(tenant_id) AND public.can_manage_clients() AND public.has_client_access(id))
  WITH CHECK (public.can_manage_tenant(tenant_id) AND public.can_manage_clients() AND public.has_client_access(id));

CREATE POLICY "Miembros leen su tenant" ON public.tenants
  FOR SELECT TO authenticated USING (public.is_tenant_member(id));
CREATE POLICY "Miembros leen membresias autorizadas" ON public.tenant_memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_tenant(tenant_id));

CREATE POLICY "Miembros leen proyectos" ON public.projects
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) AND public.has_client_access(client_id));
CREATE POLICY "Colaboradores crean proyectos" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.can_contribute_to_tenant(tenant_id) AND public.has_client_access(client_id) AND created_by = auth.uid());
CREATE POLICY "Colaboradores actualizan proyectos" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.can_contribute_to_tenant(tenant_id) AND public.has_client_access(client_id))
  WITH CHECK (public.can_contribute_to_tenant(tenant_id) AND public.has_client_access(client_id));

CREATE POLICY "Miembros leen auditorias" ON public.seo_audits
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) AND public.has_client_access(client_id));
CREATE POLICY "Colaboradores crean auditorias" ON public.seo_audits
  FOR INSERT TO authenticated
  WITH CHECK (public.can_contribute_to_tenant(tenant_id) AND public.has_client_access(client_id) AND requested_by = auth.uid());
CREATE POLICY "Colaboradores actualizan auditorias" ON public.seo_audits
  FOR UPDATE TO authenticated
  USING (public.can_contribute_to_tenant(tenant_id) AND public.has_client_access(client_id))
  WITH CHECK (public.can_contribute_to_tenant(tenant_id) AND public.has_client_access(client_id));

CREATE POLICY "Miembros leen referencias de acceso" ON public.seo_audit_access_refs
  FOR SELECT TO authenticated USING (public.is_internal() AND public.can_read_seo_audit(tenant_id, audit_id));
CREATE POLICY "Colaboradores crean referencias de acceso" ON public.seo_audit_access_refs
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_seo_audit(tenant_id, audit_id) AND created_by = auth.uid());
CREATE POLICY "Colaboradores actualizan referencias de acceso" ON public.seo_audit_access_refs
  FOR UPDATE TO authenticated
  USING (public.can_write_seo_audit(tenant_id, audit_id))
  WITH CHECK (public.can_write_seo_audit(tenant_id, audit_id));

CREATE POLICY "Miembros leen evidencias" ON public.seo_audit_evidence
  FOR SELECT TO authenticated USING (public.is_internal() AND public.can_read_seo_audit(tenant_id, audit_id));
CREATE POLICY "Colaboradores registran evidencias" ON public.seo_audit_evidence
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_seo_audit(tenant_id, audit_id) AND created_by = auth.uid());

CREATE POLICY "Miembros leen hallazgos" ON public.seo_audit_findings
  FOR SELECT TO authenticated USING (public.can_read_seo_audit(tenant_id, audit_id));
CREATE POLICY "Colaboradores crean hallazgos" ON public.seo_audit_findings
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_seo_audit(tenant_id, audit_id) AND created_by = auth.uid());
CREATE POLICY "Colaboradores actualizan hallazgos" ON public.seo_audit_findings
  FOR UPDATE TO authenticated
  USING (public.can_write_seo_audit(tenant_id, audit_id))
  WITH CHECK (public.can_write_seo_audit(tenant_id, audit_id));

CREATE POLICY "Miembros leen enlaces de evidencia" ON public.seo_finding_evidence
  FOR SELECT TO authenticated USING (public.is_internal() AND public.can_read_seo_audit(tenant_id, audit_id));
CREATE POLICY "Colaboradores enlazan evidencias" ON public.seo_finding_evidence
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_seo_audit(tenant_id, audit_id) AND linked_by = auth.uid());

CREATE POLICY "Miembros leen cobertura" ON public.seo_service_coverage
  FOR SELECT TO authenticated USING (public.can_read_seo_audit(tenant_id, audit_id));
CREATE POLICY "Colaboradores crean cobertura" ON public.seo_service_coverage
  FOR INSERT TO authenticated WITH CHECK (public.can_write_seo_audit(tenant_id, audit_id));
CREATE POLICY "Colaboradores actualizan cobertura" ON public.seo_service_coverage
  FOR UPDATE TO authenticated
  USING (public.can_write_seo_audit(tenant_id, audit_id))
  WITH CHECK (public.can_write_seo_audit(tenant_id, audit_id));

CREATE POLICY "Miembros leen eventos de auditoria" ON public.seo_audit_state_events
  FOR SELECT TO authenticated USING (public.is_internal() AND public.can_read_seo_audit(tenant_id, audit_id));

GRANT SELECT ON public.tenants, public.tenant_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.seo_audits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.seo_audit_access_refs TO authenticated;
GRANT SELECT, INSERT ON public.seo_audit_evidence TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.seo_audit_findings TO authenticated;
GRANT SELECT, INSERT ON public.seo_finding_evidence TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.seo_service_coverage TO authenticated;
GRANT SELECT ON public.seo_audit_state_events TO authenticated;

GRANT ALL ON public.tenants, public.tenant_memberships, public.projects TO service_role;
GRANT ALL ON public.seo_audits, public.seo_audit_access_refs TO service_role;
GRANT ALL ON public.seo_audit_evidence, public.seo_audit_findings TO service_role;
GRANT ALL ON public.seo_finding_evidence, public.seo_service_coverage TO service_role;
GRANT ALL ON public.seo_audit_state_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.seo_audit_state_events_id_seq TO service_role;
