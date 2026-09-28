-- Archivado reversible de clientes y auditorias SEO.
-- No hay borrado: evidencias e historial se conservan. Archivar retira un registro del
-- trabajo diario, lo deja en solo lectura y se puede deshacer restaurandolo.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE public.seo_audits
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid;

DO $$ BEGIN
  ALTER TABLE public.clients ADD CONSTRAINT clients_archive_consistent
    CHECK ((archived_at IS NULL) = (archived_by IS NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.seo_audits ADD CONSTRAINT seo_audits_archive_consistent
    CHECK ((archived_at IS NULL) = (archived_by IS NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Clientes: quien archiva firma con su propio usuario; archivar no se combina con otros
-- cambios; un cliente archivado es de solo lectura hasta restaurarlo. Quien puede
-- actualizar un cliente ya lo limita la politica RLS de 0005 (managers del tenant).
CREATE OR REPLACE FUNCTION public.seo_client_guard_archive()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _is_service_role boolean := COALESCE(auth.role() = 'service_role', false);
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.archived_at IS NOT NULL OR NEW.archived_by IS NOT NULL THEN
      RAISE EXCEPTION 'Un cliente nuevo no puede nacer archivado' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.archived_at IS DISTINCT FROM OLD.archived_at OR NEW.archived_by IS DISTINCT FROM OLD.archived_by THEN
    IF (to_jsonb(NEW) - ARRAY['archived_at', 'archived_by']) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['archived_at', 'archived_by']) THEN
      RAISE EXCEPTION 'Archivar o restaurar un cliente no puede combinarse con otros cambios' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.archived_at IS NOT NULL AND NOT _is_service_role AND NEW.archived_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Solo puedes archivar en tu propio nombre' USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'El cliente esta archivado: restauralo antes de modificarlo' USING ERRCODE = 'object_not_in_prerequisite_state';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_guard_archive_trg ON public.clients;
CREATE TRIGGER clients_guard_archive_trg
BEFORE INSERT OR UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.seo_client_guard_archive();

-- Proyectos y auditorias nuevas no pueden colgar de un cliente archivado, y los
-- proyectos de un cliente archivado no se modifican.
CREATE OR REPLACE FUNCTION public.seo_reject_archived_client()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.clients c WHERE c.id = NEW.client_id AND c.archived_at IS NOT NULL) THEN
    RAISE EXCEPTION 'El cliente esta archivado: restauralo antes de registrar trabajo nuevo' USING ERRCODE = 'object_not_in_prerequisite_state';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_reject_archived_client_trg ON public.projects;
CREATE TRIGGER projects_reject_archived_client_trg
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.seo_reject_archived_client();

-- Auditorias: archivar o restaurar exige manager del tenant (los colaboradores pueden
-- actualizar la fila por RLS, pero no retirarla del trabajo diario); nada mas cambia a la
-- vez; una auditoria archivada, o de un cliente archivado, es de solo lectura.
CREATE OR REPLACE FUNCTION public.seo_audit_guard_archive()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _is_service_role boolean := COALESCE(auth.role() = 'service_role', false);
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.archived_at IS NOT NULL OR NEW.archived_by IS NOT NULL THEN
      RAISE EXCEPTION 'Una auditoria nueva no puede nacer archivada' USING ERRCODE = 'check_violation';
    END IF;
    IF EXISTS (SELECT 1 FROM public.clients c WHERE c.id = NEW.client_id AND c.archived_at IS NOT NULL) THEN
      RAISE EXCEPTION 'El cliente esta archivado: restauralo antes de registrar trabajo nuevo' USING ERRCODE = 'object_not_in_prerequisite_state';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.archived_at IS DISTINCT FROM OLD.archived_at OR NEW.archived_by IS DISTINCT FROM OLD.archived_by THEN
    IF (to_jsonb(NEW) - ARRAY['archived_at', 'archived_by', 'updated_at'])
       IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['archived_at', 'archived_by', 'updated_at']) THEN
      RAISE EXCEPTION 'Archivar o restaurar una auditoria no puede combinarse con otros cambios' USING ERRCODE = 'check_violation';
    END IF;
    IF NOT _is_service_role AND NOT public.can_manage_tenant(NEW.tenant_id) THEN
      RAISE EXCEPTION 'Solo un manager del tenant puede archivar o restaurar auditorias' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.archived_at IS NOT NULL AND NOT _is_service_role AND NEW.archived_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Solo puedes archivar en tu propio nombre' USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'La auditoria esta archivada: restaurala antes de modificarla' USING ERRCODE = 'object_not_in_prerequisite_state';
  END IF;
  IF EXISTS (SELECT 1 FROM public.clients c WHERE c.id = NEW.client_id AND c.archived_at IS NOT NULL) THEN
    RAISE EXCEPTION 'El cliente esta archivado: restauralo antes de modificar sus auditorias' USING ERRCODE = 'object_not_in_prerequisite_state';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seo_audits_guard_archive_trg ON public.seo_audits;
CREATE TRIGGER seo_audits_guard_archive_trg
BEFORE INSERT OR UPDATE ON public.seo_audits
FOR EACH ROW EXECUTE FUNCTION public.seo_audit_guard_archive();

REVOKE ALL ON FUNCTION public.seo_client_guard_archive() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seo_reject_archived_client() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seo_audit_guard_archive() FROM PUBLIC;
