-- Decisión del Project Manager sobre cada hallazgo y cierre del archivado en artefactos hijos.
-- Idempotente: el runner de staging la reaplica sin efectos si ya existe.

ALTER TABLE public.seo_audit_findings
  ADD COLUMN IF NOT EXISTS review_decision text NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.seo_audit_findings ADD CONSTRAINT seo_findings_review_decision_valid
    CHECK (review_decision IN ('pendiente', 'priorizar', 'investigar', 'descartar'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.seo_audit_findings ADD CONSTRAINT seo_findings_review_note_length
    CHECK (review_note IS NULL OR char_length(review_note) <= 3000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.seo_audit_findings ADD CONSTRAINT seo_findings_review_signed
    CHECK ((reviewed_by IS NULL) = (reviewed_at IS NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Solo un manager decide; quién y cuándo los fija la base de datos (no se pueden falsear);
-- decidir no se combina con otros cambios; un hallazgo nuevo nace sin decisión.
CREATE OR REPLACE FUNCTION public.seo_finding_guard_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _is_service_role boolean := COALESCE(auth.role() = 'service_role', false);
  _review_fields constant text[] := ARRAY['review_decision', 'review_note', 'reviewed_by', 'reviewed_at', 'updated_at'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.review_decision <> 'pendiente' OR NEW.review_note IS NOT NULL
       OR NEW.reviewed_by IS NOT NULL OR NEW.reviewed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Un hallazgo nuevo nace pendiente de decision' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.review_decision IS DISTINCT FROM OLD.review_decision
     OR NEW.review_note IS DISTINCT FROM OLD.review_note
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
    IF (to_jsonb(NEW) - _review_fields) IS DISTINCT FROM (to_jsonb(OLD) - _review_fields) THEN
      RAISE EXCEPTION 'Decidir sobre un hallazgo no puede combinarse con otros cambios' USING ERRCODE = 'check_violation';
    END IF;
    IF NOT _is_service_role AND NOT public.can_manage_tenant(NEW.tenant_id) THEN
      RAISE EXCEPTION 'Solo un manager del tenant decide sobre hallazgos' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NOT _is_service_role THEN
      NEW.reviewed_by := auth.uid();
      NEW.reviewed_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seo_findings_guard_review_trg ON public.seo_audit_findings;
CREATE TRIGGER seo_findings_guard_review_trg
BEFORE INSERT OR UPDATE ON public.seo_audit_findings
FOR EACH ROW EXECUTE FUNCTION public.seo_finding_guard_review();
REVOKE ALL ON FUNCTION public.seo_finding_guard_review() FROM PUBLIC;

-- Artefactos hijos (referencias, evidencias, hallazgos, enlaces y cobertura) en solo lectura
-- cuando la auditoría o su cliente están archivados, igual que en validado o cancelado.
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
      JOIN public.clients c ON c.id = a.client_id
      WHERE a.id = _audit_id
        AND a.tenant_id = _tenant_id
        AND a.state NOT IN ('validado', 'cancelado')
        AND a.archived_at IS NULL
        AND c.archived_at IS NULL
        AND public.has_client_access(a.client_id)
    )
$$;
