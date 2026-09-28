-- Seguimiento de hallazgos: tareas de investigación y acciones del plan, con un PM
-- responsable y un agente asignado. Idempotente: el runner de staging la reaplica sin efectos.

CREATE TABLE IF NOT EXISTS public.seo_finding_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  audit_id uuid NOT NULL,
  finding_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  detail text NOT NULL,
  done_criteria text,
  owner_user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE RESTRICT,
  due_date date,
  status text NOT NULL DEFAULT 'pendiente',
  conclusion text,
  outcome text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_by uuid,
  completed_at timestamptz,
  CONSTRAINT seo_finding_actions_finding_fk
    FOREIGN KEY (finding_id, tenant_id, audit_id)
    REFERENCES public.seo_audit_findings(id, tenant_id, audit_id)
    ON DELETE RESTRICT,
  CONSTRAINT seo_finding_actions_kind_valid CHECK (kind IN ('investigacion', 'accion')),
  CONSTRAINT seo_finding_actions_status_valid
    CHECK (status IN ('pendiente', 'en_curso', 'hecha', 'cancelada')),
  CONSTRAINT seo_finding_actions_outcome_valid
    CHECK (outcome IS NULL OR outcome IN ('priorizar', 'descartar')),
  CONSTRAINT seo_finding_actions_text_lengths CHECK (
    char_length(btrim(title)) BETWEEN 1 AND 200
    AND char_length(btrim(detail)) BETWEEN 1 AND 2000
    AND (done_criteria IS NULL OR char_length(done_criteria) <= 1000)
    AND (conclusion IS NULL OR char_length(conclusion) <= 3000)
  ),
  CONSTRAINT seo_finding_actions_closed_signed CHECK (
    ((status IN ('hecha', 'cancelada')) = (completed_at IS NOT NULL))
    AND ((completed_at IS NULL) = (completed_by IS NULL))
  ),
  CONSTRAINT seo_finding_actions_done_has_conclusion
    CHECK (status <> 'hecha' OR (conclusion IS NOT NULL AND btrim(conclusion) <> '')),
  CONSTRAINT seo_finding_actions_outcome_only_investigation
    CHECK (outcome IS NULL OR (kind = 'investigacion' AND status = 'hecha'))
);

CREATE INDEX IF NOT EXISTS seo_finding_actions_audit_idx
  ON public.seo_finding_actions (tenant_id, audit_id, status);
CREATE INDEX IF NOT EXISTS seo_finding_actions_finding_idx
  ON public.seo_finding_actions (tenant_id, audit_id, finding_id);

-- ¿Es un Project Manager o super admin activo? (user_access solo es legible para uno mismo).
CREATE OR REPLACE FUNCTION public.is_active_project_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_access ua
    WHERE ua.user_id = _user_id
      AND ua.status = 'activo'
      AND ua.role IN ('super_admin', 'project_manager')
  )
$$;
REVOKE ALL ON FUNCTION public.is_active_project_manager(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_project_manager(uuid) TO authenticated, service_role;

-- Nacen pendientes; el responsable es un PM activo; hallazgo, tipo y autor son inmutables;
-- cerrar (hecha o cancelada) lo firma la base de datos y una tarea cerrada no cambia.
CREATE OR REPLACE FUNCTION public.seo_finding_action_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _is_service_role boolean := COALESCE(auth.role() = 'service_role', false);
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pendiente' OR NEW.conclusion IS NOT NULL OR NEW.outcome IS NOT NULL
       OR NEW.completed_by IS NOT NULL OR NEW.completed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Una tarea nueva nace pendiente y sin conclusion' USING ERRCODE = 'check_violation';
    END IF;
    IF NOT public.is_active_project_manager(NEW.owner_user_id) THEN
      RAISE EXCEPTION 'El responsable debe ser un Project Manager activo' USING ERRCODE = 'check_violation';
    END IF;
    NEW.created_at := now();
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF OLD.status IN ('hecha', 'cancelada') THEN
    RAISE EXCEPTION 'La tarea esta cerrada y no admite cambios' USING ERRCODE = 'object_not_in_prerequisite_state';
  END IF;
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id OR NEW.audit_id IS DISTINCT FROM OLD.audit_id
     OR NEW.finding_id IS DISTINCT FROM OLD.finding_id OR NEW.kind IS DISTINCT FROM OLD.kind
     OR NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Hallazgo, tipo y autor de una tarea son inmutables' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id
     AND NOT public.is_active_project_manager(NEW.owner_user_id) THEN
    RAISE EXCEPTION 'El responsable debe ser un Project Manager activo' USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status IN ('hecha', 'cancelada') THEN
    IF NOT _is_service_role THEN
      NEW.completed_by := auth.uid();
    END IF;
    NEW.completed_at := now();
  ELSE
    NEW.completed_by := NULL;
    NEW.completed_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seo_finding_actions_guard_trg ON public.seo_finding_actions;
CREATE TRIGGER seo_finding_actions_guard_trg
BEFORE INSERT OR UPDATE ON public.seo_finding_actions
FOR EACH ROW EXECUTE FUNCTION public.seo_finding_action_guard();
REVOKE ALL ON FUNCTION public.seo_finding_action_guard() FROM PUBLIC;

-- Descartar un hallazgo exige motivo (solo decisiones nuevas: NOT VALID respeta las previas).
DO $$ BEGIN
  ALTER TABLE public.seo_audit_findings ADD CONSTRAINT seo_findings_discard_needs_reason
    CHECK (review_decision <> 'descartar' OR (review_note IS NOT NULL AND btrim(review_note) <> ''))
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS: tareas internas; mismas reglas de escritura que el resto de artefactos de la auditoría
-- (cerrada, archivada o de cliente archivado => solo lectura). Sin DELETE.
ALTER TABLE public.seo_finding_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Internos leen tareas de hallazgos" ON public.seo_finding_actions;
DROP POLICY IF EXISTS "Colaboradores crean tareas de hallazgos" ON public.seo_finding_actions;
DROP POLICY IF EXISTS "Colaboradores actualizan tareas de hallazgos" ON public.seo_finding_actions;
CREATE POLICY "Internos leen tareas de hallazgos" ON public.seo_finding_actions
  FOR SELECT TO authenticated
  USING (public.is_internal() AND public.can_read_seo_audit(tenant_id, audit_id));
CREATE POLICY "Colaboradores crean tareas de hallazgos" ON public.seo_finding_actions
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_seo_audit(tenant_id, audit_id) AND created_by = auth.uid());
CREATE POLICY "Colaboradores actualizan tareas de hallazgos" ON public.seo_finding_actions
  FOR UPDATE TO authenticated
  USING (public.can_write_seo_audit(tenant_id, audit_id))
  WITH CHECK (public.can_write_seo_audit(tenant_id, audit_id));

REVOKE ALL ON public.seo_finding_actions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.seo_finding_actions TO authenticated;
GRANT ALL ON public.seo_finding_actions TO service_role;
