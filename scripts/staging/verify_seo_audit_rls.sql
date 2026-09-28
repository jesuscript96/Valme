-- Verificacion reproducible de aislamiento y permisos de 0005_seo_audit_persistence.
-- Ejecutar SOLO en una base de staging con las migraciones 0000 a 0006 aplicadas:
--   psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f scripts/staging/verify_seo_audit_rls.sql
-- Todo ocurre dentro de una transaccion que termina en ROLLBACK: no deja datos.
-- Cada escenario imprime "OK n: ..."; cualquier comprobacion fallida aborta con "FALLO: ...".
-- Estas son pruebas reales de permisos contra PostgreSQL (RLS, grants y triggers),
-- no comprobaciones estaticas del texto de la migracion.

\set ON_ERROR_STOP 1
BEGIN;

-- ---------- Utilidades ----------
-- Suplantacion compatible con auth.uid() de Supabase.
CREATE FUNCTION pg_temp.como(_uid uuid) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claim.sub', _uid::text, true),
         set_config('request.jwt.claims', json_build_object('sub', _uid, 'role', 'authenticated')::text, true);
$$;

-- Filas visibles para el usuario actual.
CREATE FUNCTION pg_temp.n(_q text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE r bigint; BEGIN EXECUTE 'SELECT count(*) FROM (' || _q || ') s' INTO r; RETURN r; END $$;

CREATE FUNCTION pg_temp.ve(_q text, _label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF pg_temp.n(_q) = 0 THEN RAISE EXCEPTION 'FALLO: deberia ver %', _label; END IF; END $$;

CREATE FUNCTION pg_temp.no_ve(_q text, _label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF pg_temp.n(_q) <> 0 THEN RAISE EXCEPTION 'FALLO: no deberia ver %', _label; END IF; END $$;

-- Contrato de comprobacion de escrituras (tres resultados distintos, nunca intercambiables):
--   pg_temp.rechazado(sql, etiqueta, sqlstate, mensaje LIKE opcional)
--       La sentencia DEBE lanzar una excepcion con ese SQLSTATE exacto y, si se indica,
--       con un mensaje que cumpla el patron. Cualquier otra excepcion (clave foranea 23503,
--       columna inexistente 42703, sintaxis 42601, unicidad 23505, check 23514, etc.) o
--       la ausencia de excepcion aborta la verificacion con FALLO.
--   pg_temp.sin_efecto(sql, etiqueta)
--       La sentencia DEBE ejecutarse sin error y afectar a 0 filas (filtrado por RLS).
--   pg_temp.permitido(sql, etiqueta)
--       La sentencia DEBE ejecutarse sin error y afectar al menos a una fila.
-- SQLSTATE usados:
--   42501 insufficient_privilege: falta de GRANT ('permission denied for table ...')
--         o WITH CHECK de RLS ('new row violates row-level security policy ...').
--   P0001 raise_exception: excepcion explicita de los triggers de 0005.
--   23514 check_violation: 0006, archivar combinado con otros cambios.
--   55000 object_not_in_prerequisite_state: 0006, registro archivado en solo lectura.
CREATE FUNCTION pg_temp.rechazado(_q text, _label text, _sqlstate text, _msg text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE c bigint; st text; m text;
BEGIN
  BEGIN
    EXECUTE _q;
    GET DIAGNOSTICS c = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS st = RETURNED_SQLSTATE, m = MESSAGE_TEXT;
    IF st IS DISTINCT FROM _sqlstate OR (_msg IS NOT NULL AND m NOT LIKE _msg) THEN
      RAISE EXCEPTION 'FALLO: % se rechazo por un motivo inesperado: [%] % (se esperaba [%] %)',
        _label, st, m, _sqlstate, COALESCE(_msg, '*');
    END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'FALLO: se permitio % (% filas; se esperaba [%])', _label, c, _sqlstate;
END $$;

CREATE FUNCTION pg_temp.sin_efecto(_q text, _label text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE c bigint; st text; m text;
BEGIN
  BEGIN
    EXECUTE _q;
    GET DIAGNOSTICS c = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS st = RETURNED_SQLSTATE, m = MESSAGE_TEXT;
    RAISE EXCEPTION 'FALLO: % debia filtrarse por RLS sin error y lanzo [%] %', _label, st, m;
  END;
  IF c <> 0 THEN RAISE EXCEPTION 'FALLO: se permitio % (% filas)', _label, c; END IF;
END $$;

CREATE FUNCTION pg_temp.permitido(_q text, _label text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE c bigint;
BEGIN
  BEGIN
    EXECUTE _q;
    GET DIAGNOSTICS c = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'FALLO: se rechazo % ([%] %)', _label, SQLSTATE, SQLERRM;
  END;
  IF c = 0 THEN RAISE EXCEPTION 'FALLO: % no afecto a ninguna fila', _label; END IF;
END $$;

-- Patrones de mensaje (PostgreSQL en ingles, como en Supabase).
-- Sin GRANT: 'permission denied for table %'. RLS WITH CHECK: 'new row violates row-level security policy%'.

-- Negativos cross-tenant sobre las 10 tablas: lectura, alta y modificacion.
-- _me: usuario actual; _t/_c/_p/_a/_f: tenant, cliente, proyecto, auditoria y hallazgo ajenos;
-- _ev: evidencia ajena aun no enlazada (evita choques de clave primaria en seo_finding_evidence).
CREATE FUNCTION pg_temp.cruzado(_me uuid, _t uuid, _c uuid, _p uuid, _a uuid, _f uuid, _ev uuid, _who text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  tbl text;
  rls constant text := 'new row violates row-level security policy%';
  nogrant constant text := 'permission denied for table %';
BEGIN
  -- Lectura: ninguna fila del tenant ajeno en ninguna de las 10 tablas (ni en clients).
  PERFORM pg_temp.no_ve(format('SELECT 1 FROM public.tenants WHERE id = %L', _t), _who || ': tenants ajeno');
  PERFORM pg_temp.no_ve(format('SELECT 1 FROM public.clients WHERE tenant_id = %L', _t), _who || ': clients ajenos');
  FOREACH tbl IN ARRAY ARRAY['tenant_memberships', 'projects', 'seo_audits', 'seo_audit_access_refs',
    'seo_audit_evidence', 'seo_audit_findings', 'seo_finding_evidence', 'seo_service_coverage', 'seo_audit_state_events']
  LOOP
    PERFORM pg_temp.no_ve(format('SELECT 1 FROM public.%I WHERE tenant_id = %L', tbl, _t), _who || ': ' || tbl || ' ajeno');
  END LOOP;

  -- Alta en el tenant ajeno: sin GRANT o por WITH CHECK de RLS, nunca por FK/constraint.
  PERFORM pg_temp.rechazado($q$INSERT INTO public.tenants (nombre, slug) VALUES ('x', 'verif-cruzado')$q$,
    _who || ': INSERT tenants', '42501', nogrant);
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.tenant_memberships (tenant_id, user_id, role) VALUES (%L, %L, 'owner')$q$, _t, _me),
    _who || ': INSERT tenant_memberships ajeno', '42501', nogrant);
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.projects (tenant_id, client_id, nombre, primary_domain, created_by)
    VALUES (%L, %L, 'x', 'x.test', %L)$q$, _t, _c, _me), _who || ': INSERT projects ajeno', '42501', rls);
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.seo_audits (tenant_id, client_id, project_id, service_ids, requested_by, primary_domain,
    seed_urls, markets, languages, authorized_scope, requested_capability_ids, max_pages, max_duration_minutes,
    max_cost_amount, currency, contract_version) VALUES (%L, %L, %L, ARRAY['seo'], %L, 'x.test', ARRAY['https://x.test/'],
    ARRAY['ES'], ARRAY['es'], '{}'::jsonb, ARRAY['technical'], 10, 10, 0, 'EUR', 'v1')$q$, _t, _c, _p, _me),
    _who || ': INSERT seo_audits ajeno', '42501', rls);
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.seo_audit_access_refs (tenant_id, audit_id, access_ref, kind, created_by)
    VALUES (%L, %L, 'ref-cruzada', 'ga4', %L)$q$, _t, _a, _me), _who || ': INSERT seo_audit_access_refs ajeno', '42501', rls);
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.seo_audit_evidence (tenant_id, audit_id, url_or_resource, source, observed_at,
    collection_method, observed_data, created_by) VALUES (%L, %L, 'https://x.test/', 'fixture', now(), 'manual', 'x', %L)$q$, _t, _a, _me),
    _who || ': INSERT seo_audit_evidence ajeno', '42501', rls);
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.seo_audit_findings (tenant_id, audit_id, category, related_service_id, title,
    description, priority, impact, recommendation, result_type, confidence, sources, observed_at, responsible_kind, responsible_id,
    responsible_name, created_by) VALUES (%L, %L, 'seo_tecnico', 'seo', 'x', 'x', 'media', 'x', 'x', 'observacion', 'media',
    ARRAY['fixture'], now(), 'tool', 't1', 'Tool', %L)$q$, _t, _a, _me), _who || ': INSERT seo_audit_findings ajeno', '42501', rls);
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.seo_finding_evidence (tenant_id, audit_id, finding_id, evidence_id, linked_by)
    VALUES (%L, %L, %L, %L, %L)$q$, _t, _a, _f, _ev, _me), _who || ': INSERT seo_finding_evidence ajeno', '42501', rls);
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.seo_service_coverage (tenant_id, audit_id, service_id, state)
    VALUES (%L, %L, 'aeo', 'cobertura_parcial')$q$, _t, _a), _who || ': INSERT seo_service_coverage ajeno', '42501', rls);
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.seo_audit_state_events (tenant_id, audit_id, from_state, to_state, actor_id)
    VALUES (%L, %L, 'borrador', 'autorizado', %L)$q$, _t, _a, _me), _who || ': INSERT seo_audit_state_events ajeno', '42501', nogrant);

  -- Modificacion: con GRANT UPDATE, RLS filtra y afecta a 0 filas; sin GRANT, 42501.
  PERFORM pg_temp.sin_efecto(format($q$UPDATE public.projects SET nombre = 'x' WHERE tenant_id = %L$q$, _t), _who || ': UPDATE projects ajeno');
  PERFORM pg_temp.sin_efecto(format($q$UPDATE public.seo_audits SET transition_reason = 'x' WHERE tenant_id = %L$q$, _t), _who || ': UPDATE seo_audits ajeno');
  PERFORM pg_temp.sin_efecto(format($q$UPDATE public.seo_audit_access_refs SET kind = 'ga4' WHERE tenant_id = %L$q$, _t), _who || ': UPDATE seo_audit_access_refs ajeno');
  PERFORM pg_temp.sin_efecto(format($q$UPDATE public.seo_audit_findings SET title = 'x' WHERE tenant_id = %L$q$, _t), _who || ': UPDATE seo_audit_findings ajeno');
  PERFORM pg_temp.sin_efecto(format($q$UPDATE public.seo_service_coverage SET reason = 'x' WHERE tenant_id = %L$q$, _t), _who || ': UPDATE seo_service_coverage ajeno');
  PERFORM pg_temp.rechazado(format($q$UPDATE public.tenants SET nombre = 'x' WHERE id = %L$q$, _t), _who || ': UPDATE tenants ajeno', '42501', nogrant);
  PERFORM pg_temp.rechazado(format($q$UPDATE public.tenant_memberships SET role = 'owner' WHERE tenant_id = %L$q$, _t), _who || ': UPDATE tenant_memberships ajeno', '42501', nogrant);
  PERFORM pg_temp.rechazado(format($q$UPDATE public.seo_audit_evidence SET source = 'x' WHERE tenant_id = %L$q$, _t), _who || ': UPDATE seo_audit_evidence ajeno', '42501', nogrant);
  PERFORM pg_temp.rechazado(format($q$UPDATE public.seo_finding_evidence SET linked_by = %L WHERE tenant_id = %L$q$, _me, _t), _who || ': UPDATE seo_finding_evidence ajeno', '42501', nogrant);
  PERFORM pg_temp.rechazado(format($q$UPDATE public.seo_audit_state_events SET reason = 'x' WHERE tenant_id = %L$q$, _t), _who || ': UPDATE seo_audit_state_events ajeno', '42501', nogrant);
END $$;

-- Todos los caminos de escritura de artefactos hijos deben quedar cerrados cuando
-- la auditoria alcanza un estado terminal. La funcion conserva una instantanea
-- minima para demostrar que los rechazos tampoco alteran datos existentes.
CREATE FUNCTION pg_temp.terminal_inmutable(
  _audit uuid,
  _access uuid,
  _finding uuid,
  _free_evidence uuid,
  _tag text
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  access_n bigint;
  evidence_n bigint;
  finding_n bigint;
  link_n bigint;
  coverage_n bigint;
  access_kind text;
  finding_title text;
  coverage_reason text;
BEGIN
  SELECT count(*) INTO access_n FROM public.seo_audit_access_refs WHERE audit_id = _audit;
  SELECT count(*) INTO evidence_n FROM public.seo_audit_evidence WHERE audit_id = _audit;
  SELECT count(*) INTO finding_n FROM public.seo_audit_findings WHERE audit_id = _audit;
  SELECT count(*) INTO link_n FROM public.seo_finding_evidence WHERE audit_id = _audit;
  SELECT count(*) INTO coverage_n FROM public.seo_service_coverage WHERE audit_id = _audit;
  SELECT kind INTO access_kind FROM public.seo_audit_access_refs WHERE id = _access;
  SELECT title INTO finding_title FROM public.seo_audit_findings WHERE id = _finding;
  SELECT reason INTO coverage_reason FROM public.seo_service_coverage WHERE audit_id = _audit AND service_id = 'seo';
  IF access_n = 0 OR evidence_n = 0 OR finding_n = 0 OR coverage_n = 0 THEN
    RAISE EXCEPTION 'FALLO: % dejo de mostrar sus artefactos tras alcanzar el estado terminal', _tag;
  END IF;

  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.seo_audit_access_refs
    (tenant_id, audit_id, access_ref, kind, created_by)
    VALUES ('aaaaaaaa-0000-0000-0000-00000000000a', %L, %L, 'ga4', auth.uid())$q$,
    _audit, 'terminal-' || _tag), _tag || ': crea referencia', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.seo_audit_evidence
    (tenant_id, audit_id, url_or_resource, source, observed_at, collection_method, observed_data, created_by)
    VALUES ('aaaaaaaa-0000-0000-0000-00000000000a', %L, %L, 'fixture', now(), 'manual', 'x', auth.uid())$q$,
    _audit, 'https://terminal.test/' || _tag), _tag || ': crea evidencia', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.seo_audit_findings
    (tenant_id, audit_id, category, related_service_id, title, description, priority, impact, recommendation,
     result_type, confidence, sources, observed_at, responsible_kind, responsible_id, responsible_name, created_by)
    VALUES ('aaaaaaaa-0000-0000-0000-00000000000a', %L, 'seo_tecnico', 'seo', 'terminal', 'x', 'media',
      'x', 'x', 'observacion', 'media', ARRAY['fixture'], now(), 'tool', 'terminal', 'Tool', auth.uid())$q$,
    _audit), _tag || ': crea hallazgo', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.seo_finding_evidence
    (tenant_id, audit_id, finding_id, evidence_id, linked_by)
    VALUES ('aaaaaaaa-0000-0000-0000-00000000000a', %L, %L, %L, auth.uid())$q$,
    _audit, _finding, _free_evidence), _tag || ': enlaza evidencia', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.rechazado(format($q$INSERT INTO public.seo_service_coverage
    (tenant_id, audit_id, service_id, state)
    VALUES ('aaaaaaaa-0000-0000-0000-00000000000a', %L, 'aeo', 'cobertura_parcial')$q$,
    _audit), _tag || ': crea cobertura', '42501', 'new row violates row-level security policy%');

  PERFORM pg_temp.sin_efecto(format($q$UPDATE public.seo_audit_access_refs SET kind = 'ga4' WHERE id = %L$q$, _access),
    _tag || ': actualiza referencia');
  PERFORM pg_temp.sin_efecto(format($q$UPDATE public.seo_audit_findings SET title = 'terminal' WHERE id = %L$q$, _finding),
    _tag || ': actualiza hallazgo');
  PERFORM pg_temp.sin_efecto(format($q$UPDATE public.seo_service_coverage SET reason = 'terminal' WHERE audit_id = %L AND service_id = 'seo'$q$, _audit),
    _tag || ': actualiza cobertura');

  IF (SELECT count(*) FROM public.seo_audit_access_refs WHERE audit_id = _audit) IS DISTINCT FROM access_n
     OR (SELECT count(*) FROM public.seo_audit_evidence WHERE audit_id = _audit) IS DISTINCT FROM evidence_n
     OR (SELECT count(*) FROM public.seo_audit_findings WHERE audit_id = _audit) IS DISTINCT FROM finding_n
     OR (SELECT count(*) FROM public.seo_finding_evidence WHERE audit_id = _audit) IS DISTINCT FROM link_n
     OR (SELECT count(*) FROM public.seo_service_coverage WHERE audit_id = _audit) IS DISTINCT FROM coverage_n
     OR (SELECT kind FROM public.seo_audit_access_refs WHERE id = _access) IS DISTINCT FROM access_kind
     OR (SELECT title FROM public.seo_audit_findings WHERE id = _finding) IS DISTINCT FROM finding_title
     OR (SELECT reason FROM public.seo_service_coverage WHERE audit_id = _audit AND service_id = 'seo') IS DISTINCT FROM coverage_reason THEN
    RAISE EXCEPTION 'FALLO: % modifico artefactos de una auditoria terminal', _tag;
  END IF;
END $$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pg_temp TO authenticated;

-- ---------- Fixture (como propietario, antes de activar RLS de sesion) ----------
-- pm1: PM del tenant A.  pm2: PM del tenant B.  cli: cliente reviewer del tenant A.
-- pmd: PM que sera degradado a equipo (tenant A).  eq: equipo activo que sera desactivado.
-- pmm: PM global limitado a member en el tenant A.
-- inv: invitado (nunca entra en el tenant de demostracion).
INSERT INTO auth.users (id, email) VALUES
  ('11111111-0000-0000-0000-000000000001', 'pm1@tenant-a.test'),
  ('22222222-0000-0000-0000-000000000002', 'pm2@tenant-b.test'),
  ('33333333-0000-0000-0000-000000000003', 'cliente@tenant-a.test'),
  ('44444444-0000-0000-0000-000000000004', 'invitado@valme.test'),
  ('55555555-0000-0000-0000-000000000005', 'pm-degradado@tenant-a.test'),
  ('66666666-0000-0000-0000-000000000006', 'equipo@tenant-a.test'),
  ('77777777-0000-0000-0000-000000000007', 'pm-member@tenant-a.test');

INSERT INTO public.tenants (id, nombre, slug) VALUES
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'Tenant A (prueba)', 'verif-tenant-a'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'Tenant B (prueba)', 'verif-tenant-b');

INSERT INTO public.clients (id, nombre, tenant_id) VALUES
  ('aaaaaaaa-0000-0000-0000-0000000000c1', 'Cliente A (prueba)', 'aaaaaaaa-0000-0000-0000-00000000000a'),
  ('aaaaaaaa-0000-0000-0000-0000000000c3', 'Cliente A2 no asignado (prueba)', 'aaaaaaaa-0000-0000-0000-00000000000a'),
  ('bbbbbbbb-0000-0000-0000-0000000000c2', 'Cliente B (prueba)', 'bbbbbbbb-0000-0000-0000-00000000000b');

INSERT INTO public.user_access (user_id, email, role, status, full_portfolio) VALUES
  ('11111111-0000-0000-0000-000000000001', 'pm1@tenant-a.test', 'project_manager', 'activo', false),
  ('22222222-0000-0000-0000-000000000002', 'pm2@tenant-b.test', 'project_manager', 'activo', false),
  ('33333333-0000-0000-0000-000000000003', 'cliente@tenant-a.test', 'cliente', 'activo', false),
  ('44444444-0000-0000-0000-000000000004', 'invitado@valme.test', 'equipo', 'invitado', false),
  ('55555555-0000-0000-0000-000000000005', 'pm-degradado@tenant-a.test', 'project_manager', 'activo', true),
  ('66666666-0000-0000-0000-000000000006', 'equipo@tenant-a.test', 'equipo', 'activo', false),
  ('77777777-0000-0000-0000-000000000007', 'pm-member@tenant-a.test', 'project_manager', 'activo', false);

INSERT INTO public.user_client_access (user_id, client_id, role) VALUES
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'project_manager'),
  ('22222222-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-0000000000c2', 'project_manager'),
  ('33333333-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'cliente'),
  ('55555555-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'project_manager'),
  ('66666666-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'equipo'),
  ('77777777-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'project_manager');

INSERT INTO public.tenant_memberships (tenant_id, user_id, role) VALUES
  ('aaaaaaaa-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000001', 'manager'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', '22222222-0000-0000-0000-000000000002', 'manager'),
  ('aaaaaaaa-0000-0000-0000-00000000000a', '33333333-0000-0000-0000-000000000003', 'reviewer'),
  ('aaaaaaaa-0000-0000-0000-00000000000a', '55555555-0000-0000-0000-000000000005', 'manager'),
  ('aaaaaaaa-0000-0000-0000-00000000000a', '66666666-0000-0000-0000-000000000006', 'member'),
  ('aaaaaaaa-0000-0000-0000-00000000000a', '77777777-0000-0000-0000-000000000007', 'member');

INSERT INTO public.projects (id, tenant_id, client_id, nombre, primary_domain, created_by) VALUES
  ('aaaaaaaa-0000-0000-0000-0000000000e1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'Web A', 'a.test', '11111111-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-0000000000e3', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c3', 'Web A2', 'a2.test', '11111111-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-0000000000e2', 'bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-0000000000c2', 'Web B', 'b.test', '22222222-0000-0000-0000-000000000002');

-- Auditorias en borrador (propietario, el trigger exige borrador tambien aqui).
INSERT INTO public.seo_audits (id, tenant_id, client_id, project_id, service_ids, requested_by, primary_domain,
  seed_urls, markets, languages, authorized_scope, requested_capability_ids, max_pages, max_duration_minutes,
  max_cost_amount, currency, contract_version) VALUES
  ('aaaaaaaa-0000-0000-0000-0000000000d1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c1',
   'aaaaaaaa-0000-0000-0000-0000000000e1', ARRAY['seo'], '11111111-0000-0000-0000-000000000001', 'a.test',
   ARRAY['https://a.test/'], ARRAY['ES'], ARRAY['es'], '{}'::jsonb, ARRAY['technical'], 10, 10, 0, 'EUR', 'v1'),
  ('aaaaaaaa-0000-0000-0000-0000000000d3', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c3',
   'aaaaaaaa-0000-0000-0000-0000000000e3', ARRAY['seo'], '11111111-0000-0000-0000-000000000001', 'a2.test',
   ARRAY['https://a2.test/'], ARRAY['ES'], ARRAY['es'], '{}'::jsonb, ARRAY['technical'], 10, 10, 0, 'EUR', 'v1'),
  ('bbbbbbbb-0000-0000-0000-0000000000d2', 'bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-0000000000c2',
   'bbbbbbbb-0000-0000-0000-0000000000e2', ARRAY['seo'], '22222222-0000-0000-0000-000000000002', 'b.test',
   ARRAY['https://b.test/'], ARRAY['ES'], ARRAY['es'], '{}'::jsonb, ARRAY['technical'], 10, 10, 0, 'EUR', 'v1'),
  -- d5: auditoria del cliente A asignado al PM que sera degradado (escenario 8).
  ('aaaaaaaa-0000-0000-0000-0000000000d5', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c1',
   'aaaaaaaa-0000-0000-0000-0000000000e1', ARRAY['seo'], '55555555-0000-0000-0000-000000000005', 'a.test',
   ARRAY['https://a.test/'], ARRAY['ES'], ARRAY['es'], '{}'::jsonb, ARRAY['technical'], 10, 10, 0, 'EUR', 'v1');

INSERT INTO public.seo_audit_access_refs (id, tenant_id, audit_id, access_ref, kind, created_by) VALUES
  ('aaaaaaaa-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'ref-gsc-a', 'search_console', '11111111-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-0000000000a5', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d5', 'ref-gsc-a5', 'search_console', '55555555-0000-0000-0000-000000000005'),
  ('bbbbbbbb-0000-0000-0000-0000000000a2', 'bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-0000000000d2', 'ref-gsc-b', 'search_console', '22222222-0000-0000-0000-000000000002');

INSERT INTO public.seo_audit_evidence (id, tenant_id, audit_id, url_or_resource, source, observed_at, collection_method, observed_data, created_by) VALUES
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'https://a.test/', 'fixture', now(), 'manual', 'dato interno A', '11111111-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-0000000000f2', 'bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-0000000000d2', 'https://b.test/', 'fixture', now(), 'manual', 'dato interno B', '22222222-0000-0000-0000-000000000002'),
  -- Evidencias sin enlazar (f6 en A, f4 en B) para los negativos de seo_finding_evidence.
  ('aaaaaaaa-0000-0000-0000-0000000000f6', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'https://a.test/libre', 'fixture', now(), 'manual', 'dato interno A libre', '11111111-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-0000000000f5', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d5', 'https://a.test/d5-libre', 'fixture', now(), 'manual', 'dato interno A5 libre', '55555555-0000-0000-0000-000000000005'),
  ('bbbbbbbb-0000-0000-0000-0000000000f4', 'bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-0000000000d2', 'https://b.test/libre', 'fixture', now(), 'manual', 'dato interno B libre', '22222222-0000-0000-0000-000000000002');

INSERT INTO public.seo_audit_findings (id, tenant_id, audit_id, category, related_service_id, title, description, priority,
  impact, recommendation, result_type, confidence, sources, observed_at, responsible_kind, responsible_id, responsible_name, created_by) VALUES
  ('aaaaaaaa-0000-0000-0000-0000000000b1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'seo_tecnico', 'seo',
   'Hallazgo A', 'desc', 'media', 'impacto', 'recomendacion', 'observacion', 'media', ARRAY['fixture'], now(), 'tool', 't1', 'Tool', '11111111-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-0000000000b2', 'bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-0000000000d2', 'seo_tecnico', 'seo',
   'Hallazgo B', 'desc', 'media', 'impacto', 'recomendacion', 'observacion', 'media', ARRAY['fixture'], now(), 'tool', 't1', 'Tool', '22222222-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-0000000000b5', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d5', 'seo_tecnico', 'seo',
   'Hallazgo A5', 'desc', 'media', 'impacto', 'recomendacion', 'observacion', 'media', ARRAY['fixture'], now(), 'tool', 't1', 'Tool', '55555555-0000-0000-0000-000000000005');

INSERT INTO public.seo_finding_evidence (tenant_id, audit_id, finding_id, evidence_id, linked_by) VALUES
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'aaaaaaaa-0000-0000-0000-0000000000b1', 'aaaaaaaa-0000-0000-0000-0000000000f1', '11111111-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-0000000000d2', 'bbbbbbbb-0000-0000-0000-0000000000b2', 'bbbbbbbb-0000-0000-0000-0000000000f2', '22222222-0000-0000-0000-000000000002');

INSERT INTO public.seo_service_coverage (tenant_id, audit_id, service_id, state) VALUES
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'seo', 'cobertura_parcial'),
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d5', 'seo', 'cobertura_parcial'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-0000000000d2', 'seo', 'cobertura_parcial');

-- Precondicion: cada una de las 10 tablas tiene filas en ambos tenants, para que
-- "no ve" y "0 filas afectadas" signifiquen aislamiento y no una tabla vacia.
DO $$
DECLARE tbl text; tid uuid;
BEGIN
  FOREACH tid IN ARRAY ARRAY['aaaaaaaa-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-00000000000b']::uuid[] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = tid) THEN RAISE EXCEPTION 'FALLO: fixture sin tenant %', tid; END IF;
    FOREACH tbl IN ARRAY ARRAY['tenant_memberships', 'projects', 'seo_audits', 'seo_audit_access_refs', 'seo_audit_evidence',
      'seo_audit_findings', 'seo_finding_evidence', 'seo_service_coverage', 'seo_audit_state_events'] LOOP
      IF pg_temp.n(format('SELECT 1 FROM public.%I WHERE tenant_id = %L', tbl, tid)) = 0 THEN
        RAISE EXCEPTION 'FALLO: fixture sin filas en % para %', tbl, tid; END IF;
    END LOOP;
  END LOOP;
END $$;

-- ---------- 1. Sincronizacion de membresias (tenant de demostracion) ----------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.tenant_memberships WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
             AND user_id = '33333333-0000-0000-0000-000000000003') THEN
    RAISE EXCEPTION 'FALLO: un usuario cliente entro en el tenant de demostracion'; END IF;
  IF EXISTS (SELECT 1 FROM public.tenant_memberships WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
             AND user_id = '44444444-0000-0000-0000-000000000004') THEN
    RAISE EXCEPTION 'FALLO: un invitado entro en el tenant de demostracion'; END IF;
  IF (SELECT role FROM public.tenant_memberships WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
      AND user_id = '11111111-0000-0000-0000-000000000001') IS DISTINCT FROM 'manager' THEN
    RAISE EXCEPTION 'FALLO: el alta activa de PM no creo membresia manager'; END IF;
  UPDATE public.user_access SET status = 'activo' WHERE user_id = '44444444-0000-0000-0000-000000000004';
  IF (SELECT role FROM public.tenant_memberships WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
      AND user_id = '44444444-0000-0000-0000-000000000004') IS DISTINCT FROM 'member' THEN
    RAISE EXCEPTION 'FALLO: la activacion no creo la membresia'; END IF;
  UPDATE public.user_access SET status = 'desactivado' WHERE user_id = '44444444-0000-0000-0000-000000000004';
  IF EXISTS (SELECT 1 FROM public.tenant_memberships WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
             AND user_id = '44444444-0000-0000-0000-000000000004') THEN
    RAISE EXCEPTION 'FALLO: la desactivacion no retiro la membresia'; END IF;
  RAISE NOTICE 'OK 1: sincronizacion de membresias del tenant de demostracion';
END $$;

SET LOCAL ROLE authenticated;

-- ---------- 2. PM A: ve lo suyo y nada del tenant B en las 10 tablas ----------
SELECT pg_temp.como('11111111-0000-0000-0000-000000000001');
DO $$ BEGIN
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.tenants WHERE id = 'aaaaaaaa-0000-0000-0000-00000000000a'$q$, 'su tenant');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.tenant_memberships WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a'$q$, 'sus membresias');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.clients WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1'$q$, 'su cliente');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.projects WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000e1'$q$, 'su proyecto');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audits WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'su auditoria');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audit_findings WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a'$q$, 'sus hallazgos');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audit_evidence WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a'$q$, 'sus evidencias');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_finding_evidence WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a'$q$, 'sus enlaces de evidencia');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audit_access_refs WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a'$q$, 'sus referencias de acceso');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_service_coverage WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a'$q$, 'su cobertura');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audit_state_events WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a'$q$, 'su historial');
  PERFORM pg_temp.no_ve($q$SELECT 1 FROM public.seo_audits WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d3'$q$, 'auditoria de un cliente no asignado');
  PERFORM pg_temp.cruzado('11111111-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-00000000000b',
    'bbbbbbbb-0000-0000-0000-0000000000c2', 'bbbbbbbb-0000-0000-0000-0000000000e2', 'bbbbbbbb-0000-0000-0000-0000000000d2',
    'bbbbbbbb-0000-0000-0000-0000000000b2', 'bbbbbbbb-0000-0000-0000-0000000000f4', 'PM A contra tenant B');
  RAISE NOTICE 'OK 2: PM A ve sus datos; contra el tenant B no lee, no inserta y no modifica en ninguna de las 10 tablas';
END $$;

-- ---------- 3. PM B: simetrico contra el tenant A ----------
SELECT pg_temp.como('22222222-0000-0000-0000-000000000002');
DO $$ BEGIN
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.tenants WHERE id = 'bbbbbbbb-0000-0000-0000-00000000000b'$q$, 'su tenant');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audits WHERE id = 'bbbbbbbb-0000-0000-0000-0000000000d2'$q$, 'su auditoria');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audit_findings WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$q$, 'sus hallazgos');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audit_evidence WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$q$, 'sus evidencias');
  PERFORM pg_temp.cruzado('22222222-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-00000000000a',
    'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000e1', 'aaaaaaaa-0000-0000-0000-0000000000d1',
    'aaaaaaaa-0000-0000-0000-0000000000b1', 'aaaaaaaa-0000-0000-0000-0000000000f6', 'PM B contra tenant A');
  RAISE NOTICE 'OK 3: PM B ve sus datos; contra el tenant A no lee, no inserta y no modifica en ninguna de las 10 tablas';
END $$;

-- ---------- 4. Cliente reviewer: lectura no interna, sin escritura ----------
SELECT pg_temp.como('33333333-0000-0000-0000-000000000003');
DO $$ BEGIN
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.tenants WHERE id = 'aaaaaaaa-0000-0000-0000-00000000000a'$q$, 'su tenant (cliente)');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.clients WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1'$q$, 'su cliente (cliente)');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.projects WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000e1'$q$, 'su proyecto (cliente)');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audits WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'su auditoria (cliente)');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audit_findings WHERE audit_id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'sus hallazgos (cliente)');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_service_coverage WHERE audit_id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'su cobertura (cliente)');
  PERFORM pg_temp.no_ve($q$SELECT 1 FROM public.seo_audit_access_refs$q$, 'referencias de acceso (cliente)');
  PERFORM pg_temp.no_ve($q$SELECT 1 FROM public.seo_audit_evidence$q$, 'evidencias (cliente)');
  PERFORM pg_temp.no_ve($q$SELECT 1 FROM public.seo_finding_evidence$q$, 'enlaces de evidencia (cliente)');
  PERFORM pg_temp.no_ve($q$SELECT 1 FROM public.seo_audit_state_events$q$, 'historial interno (cliente)');
  PERFORM pg_temp.no_ve($q$SELECT 1 FROM public.seo_audits WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d3'$q$, 'auditoria no asignada (cliente)');
  PERFORM pg_temp.no_ve($q$SELECT 1 FROM public.seo_audits WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$q$, 'auditorias de B (cliente)');
  -- Matriz completa de escritura dentro de su propio tenant y cliente.
  PERFORM pg_temp.rechazado($q$INSERT INTO public.tenants (nombre, slug) VALUES ('x', 'reviewer-x')$q$,
    'cliente crea tenant', '42501', 'permission denied for table tenants');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.tenant_memberships (tenant_id, user_id, role) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', '44444444-0000-0000-0000-000000000004', 'reviewer')$q$,
    'cliente crea membresia', '42501', 'permission denied for table tenant_memberships');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.clients (id, nombre, tenant_id) VALUES
    ('aaaaaaaa-0000-0000-0000-0000000000c4', 'x', 'aaaaaaaa-0000-0000-0000-00000000000a')$q$,
    'cliente crea cliente', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.projects (tenant_id, client_id, nombre, primary_domain, created_by) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'x', 'x.test', auth.uid())$q$,
    'cliente crea proyecto', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.seo_audits (tenant_id, client_id, project_id, service_ids, requested_by, primary_domain,
    seed_urls, markets, languages, authorized_scope, requested_capability_ids, max_pages, max_duration_minutes,
    max_cost_amount, currency, contract_version) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000e1',
     ARRAY['seo'], auth.uid(), 'a.test', ARRAY['https://a.test/'], ARRAY['ES'], ARRAY['es'], '{}'::jsonb,
     ARRAY['technical'], 10, 10, 0, 'EUR', 'v1')$q$,
    'cliente crea auditoria', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.seo_audit_access_refs (tenant_id, audit_id, access_ref, kind, created_by) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'ref-reviewer', 'ga4', auth.uid())$q$,
    'cliente crea referencia de acceso', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.seo_audit_evidence
    (tenant_id, audit_id, url_or_resource, source, observed_at, collection_method, observed_data, created_by) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'https://a.test/reviewer',
     'fixture', now(), 'manual', 'x', auth.uid())$q$,
    'cliente crea evidencia', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.seo_audit_findings
    (tenant_id, audit_id, category, related_service_id, title, description, priority, impact, recommendation,
     result_type, confidence, sources, observed_at, responsible_kind, responsible_id, responsible_name, created_by) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'seo_tecnico', 'seo',
     'x', 'x', 'media', 'x', 'x', 'observacion', 'media', ARRAY['fixture'], now(), 'tool', 'reviewer', 'Tool', auth.uid())$q$,
    'cliente crea hallazgo', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.seo_finding_evidence (tenant_id, audit_id, finding_id, evidence_id, linked_by) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'aaaaaaaa-0000-0000-0000-0000000000b1',
     'aaaaaaaa-0000-0000-0000-0000000000f6', auth.uid())$q$,
    'cliente enlaza evidencia', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.seo_service_coverage (tenant_id, audit_id, service_id, state) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'aeo', 'cobertura_parcial')$q$,
    'cliente crea cobertura', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.seo_audit_state_events (tenant_id, audit_id, from_state, to_state, actor_id) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'borrador', 'cancelado', auth.uid())$q$,
    'cliente crea evento', '42501', 'permission denied for table seo_audit_state_events');

  PERFORM pg_temp.rechazado($q$UPDATE public.tenants SET nombre = 'x' WHERE id = 'aaaaaaaa-0000-0000-0000-00000000000a'$q$,
    'cliente actualiza tenant', '42501', 'permission denied for table tenants');
  PERFORM pg_temp.rechazado($q$UPDATE public.tenant_memberships SET role = 'owner'
    WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a' AND user_id = auth.uid()$q$,
    'cliente actualiza membresia', '42501', 'permission denied for table tenant_memberships');
  PERFORM pg_temp.sin_efecto($q$UPDATE public.clients SET nombre = 'x' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1'$q$, 'cliente actualiza cliente');
  PERFORM pg_temp.sin_efecto($q$UPDATE public.projects SET nombre = 'x' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000e1'$q$, 'cliente actualiza proyecto');
  PERFORM pg_temp.sin_efecto($q$UPDATE public.seo_audits SET transition_reason = 'x' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'cliente actualiza auditoria');
  PERFORM pg_temp.sin_efecto($q$UPDATE public.seo_audit_access_refs SET kind = 'ga4' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000a1'$q$, 'cliente actualiza referencia');
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audit_evidence SET source = 'x' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000f1'$q$,
    'cliente actualiza evidencia', '42501', 'permission denied for table seo_audit_evidence');
  PERFORM pg_temp.sin_efecto($q$UPDATE public.seo_audit_findings SET title = 'x' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000b1'$q$, 'cliente actualiza hallazgo');
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_finding_evidence SET linked_by = auth.uid()
    WHERE finding_id = 'aaaaaaaa-0000-0000-0000-0000000000b1' AND evidence_id = 'aaaaaaaa-0000-0000-0000-0000000000f1'$q$,
    'cliente actualiza enlace', '42501', 'permission denied for table seo_finding_evidence');
  PERFORM pg_temp.sin_efecto($q$UPDATE public.seo_service_coverage SET reason = 'x'
    WHERE audit_id = 'aaaaaaaa-0000-0000-0000-0000000000d1' AND service_id = 'seo'$q$, 'cliente actualiza cobertura');
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audit_state_events SET reason = 'x'
    WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a'$q$,
    'cliente actualiza evento', '42501', 'permission denied for table seo_audit_state_events');
  RAISE NOTICE 'OK 4: cliente reviewer conserva su lectura permitida y no escribe en clients ni en ninguna de las 10 tablas nuevas';
END $$;

-- ---------- 5. Auditorias nuevas siempre en borrador (trigger, P0001) ----------
SELECT pg_temp.como('11111111-0000-0000-0000-000000000001');
DO $$ BEGIN
  PERFORM pg_temp.rechazado($q$INSERT INTO public.seo_audits (tenant_id, client_id, project_id, service_ids, requested_by, primary_domain,
    seed_urls, markets, languages, authorized_scope, requested_capability_ids, max_pages, max_duration_minutes,
    max_cost_amount, currency, contract_version, state, authorized_by, authorization_ref) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000e1',
     ARRAY['seo'], '11111111-0000-0000-0000-000000000001', 'a.test', ARRAY['https://a.test/'], ARRAY['ES'], ARRAY['es'],
     '{}'::jsonb, ARRAY['technical'], 10, 10, 0, 'EUR', 'v1', 'en_ejecucion', '11111111-0000-0000-0000-000000000001', 'auth-x')$q$,
    'insertar auditoria en en_ejecucion', 'P0001', 'Una auditoria nueva debe comenzar en borrador');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.seo_audits (tenant_id, client_id, project_id, service_ids, requested_by, primary_domain,
    seed_urls, markets, languages, authorized_scope, requested_capability_ids, max_pages, max_duration_minutes,
    max_cost_amount, currency, contract_version, state) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000e1',
     ARRAY['seo'], '11111111-0000-0000-0000-000000000001', 'a.test', ARRAY['https://a.test/'], ARRAY['ES'], ARRAY['es'],
     '{}'::jsonb, ARRAY['technical'], 10, 10, 0, 'EUR', 'v1', 'pendiente_autorizacion')$q$,
    'insertar auditoria en pendiente_autorizacion', 'P0001', 'Una auditoria nueva debe comenzar en borrador');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.seo_audits (tenant_id, client_id, project_id, service_ids, requested_by, primary_domain,
    seed_urls, markets, languages, authorized_scope, requested_capability_ids, max_pages, max_duration_minutes,
    max_cost_amount, currency, contract_version, authorized_by, authorization_ref) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000e1',
     ARRAY['seo'], '11111111-0000-0000-0000-000000000001', 'a.test', ARRAY['https://a.test/'], ARRAY['ES'], ARRAY['es'],
     '{}'::jsonb, ARRAY['technical'], 10, 10, 0, 'EUR', 'v1', '11111111-0000-0000-0000-000000000001', 'auth-x')$q$,
    'insertar borrador con autorizacion precargada', 'P0001', 'Una auditoria nueva no puede nacer autorizada');
  RAISE NOTICE 'OK 5: una auditoria nueva no puede nacer fuera de borrador ni autorizada';
END $$;

-- ---------- 6. Colaborador sin autorizacion de manager ----------
SELECT pg_temp.como('66666666-0000-0000-0000-000000000006');
DO $$ BEGIN
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'pendiente_autorizacion' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'member envia a autorizacion');
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET state = 'autorizado', authorized_by = auth.uid(), authorization_ref = 'auth-falsa'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'member autoriza', 'P0001', 'La transicion a autorizado requiere rol owner o manager');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'devuelto', transition_reason = 'faltan datos' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'member devuelve');
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET state = 'en_ejecucion' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$,
    'devuelto -> en_ejecucion sin autorizacion', 'P0001', 'Transicion de auditoria no permitida: devuelto -> en_ejecucion');
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET state = 'en_cola' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$,
    'devuelto -> en_cola sin autorizacion', 'P0001', 'Transicion de auditoria no permitida: devuelto -> en_cola');
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET authorized_by = auth.uid(), authorization_ref = 'auth-falsa'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'fijar authorized_by fuera de la transicion a autorizado',
    'P0001', 'La autorizacion solo puede registrarse al pasar de pendiente_autorizacion a autorizado');
  RAISE NOTICE 'OK 6: un colaborador no puede autorizar ni llegar a en_ejecucion/en_cola sin manager';
END $$;

-- ---------- 7. Reautorizacion completa y reset al cambiar alcance ----------
DO $$ BEGIN
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'pendiente_autorizacion' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'devuelto -> pendiente_autorizacion');
END $$;
SELECT pg_temp.como('11111111-0000-0000-0000-000000000001');
DO $$ BEGIN
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET state = 'autorizado', authorized_by = '66666666-0000-0000-0000-000000000006', authorization_ref = 'auth-1'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'autorizar en nombre de otro usuario', 'P0001', 'authorized_by debe coincidir con el usuario autorizador');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'autorizado', authorized_by = auth.uid(), authorization_ref = 'auth-1'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'manager autoriza');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'en_ejecucion' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'autorizado -> en_ejecucion');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'control_calidad' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'en_ejecucion -> control_calidad');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'devuelto', transition_reason = 'ampliar alcance' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'control_calidad -> devuelto');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET max_pages = 50 WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'cambiar limites en devuelto');
  IF (SELECT authorized_by IS NOT NULL OR authorization_ref IS NOT NULL FROM public.seo_audits WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1') THEN
    RAISE EXCEPTION 'FALLO: cambiar el alcance en devuelto no invalido la autorizacion'; END IF;
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET state = 'en_ejecucion' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$,
    'reanudar sin reautorizar', 'P0001', 'Transicion de auditoria no permitida: devuelto -> en_ejecucion');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'pendiente_autorizacion' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'devuelto -> pendiente_autorizacion');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'autorizado', authorized_by = auth.uid(), authorization_ref = 'auth-2'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'reautorizar');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'en_cola' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'autorizado -> en_cola');
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET authorization_ref = 'auth-3' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$,
    'cambiar authorization_ref en en_cola', 'P0001', 'La autorizacion solo puede registrarse al pasar de pendiente_autorizacion a autorizado');
  RAISE NOTICE 'OK 7: reautorizacion exigida (devuelto -> pendiente_autorizacion -> autorizado -> en_cola) y autorizacion invalidada al cambiar alcance';
END $$;

-- ---------- 8. Degradacion de PM a equipo ----------
-- d5 pertenece al cliente c1, que el PM sigue teniendo asignado tras la degradacion.
SELECT pg_temp.como('55555555-0000-0000-0000-000000000005');
DO $$ BEGIN
  IF NOT public.can_manage_tenant('aaaaaaaa-0000-0000-0000-00000000000a') THEN
    RAISE EXCEPTION 'FALLO: el PM no tenia manager antes de degradarlo'; END IF;
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audits WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d3'$q$, 'auditoria de cartera completa antes de degradar');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'pendiente_autorizacion' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d5'$q$, 'PM deja d5 en pendiente_autorizacion');
END $$;
RESET ROLE;
UPDATE public.user_access SET role = 'equipo', full_portfolio = false WHERE user_id = '55555555-0000-0000-0000-000000000005';
SET LOCAL ROLE authenticated;
SELECT pg_temp.como('55555555-0000-0000-0000-000000000005');
DO $$ BEGIN
  IF (SELECT role FROM public.tenant_memberships WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a'
      AND user_id = '55555555-0000-0000-0000-000000000005') IS DISTINCT FROM 'manager' THEN
    RAISE EXCEPTION 'FALLO: la prueba exige que la membresia externa siga guardada como manager'; END IF;
  IF public.can_manage_tenant('aaaaaaaa-0000-0000-0000-00000000000a') THEN
    RAISE EXCEPTION 'FALLO: el PM degradado conserva permisos de manager'; END IF;
  IF NOT public.can_contribute_to_tenant('aaaaaaaa-0000-0000-0000-00000000000a') THEN
    RAISE EXCEPTION 'FALLO: el PM degradado perdio permisos de member'; END IF;
  -- La auditoria sigue siendo visible y esta en pendiente_autorizacion: el rechazo no puede venir de RLS.
  IF (SELECT state FROM public.seo_audits WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d5') IS DISTINCT FROM 'pendiente_autorizacion' THEN
    RAISE EXCEPTION 'FALLO: d5 deberia ser visible y estar en pendiente_autorizacion'; END IF;
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET state = 'autorizado', authorized_by = auth.uid(), authorization_ref = 'auth-d'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d5'$q$, 'PM degradado autoriza', 'P0001', 'La transicion a autorizado requiere rol owner o manager');
  IF (SELECT state FROM public.seo_audits WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d5') IS DISTINCT FROM 'pendiente_autorizacion' THEN
    RAISE EXCEPTION 'FALLO: d5 cambio de estado tras el rechazo'; END IF;
  -- Operaciones de member que conserva.
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audit_evidence WHERE audit_id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'evidencias de cliente asignado tras degradar');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audit_findings SET recommendation = 'revisada' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000b5'$q$, 'member actualiza hallazgo de d5');
  PERFORM pg_temp.permitido($q$INSERT INTO public.seo_audit_evidence (tenant_id, audit_id, url_or_resource, source, observed_at, collection_method, observed_data, created_by)
    VALUES ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000d5', 'https://a.test/d5', 'fixture', now(), 'manual', 'x', auth.uid())$q$, 'member registra evidencia en d5');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'devuelto', transition_reason = 'falta evidencia' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d5'$q$, 'member devuelve d5 con motivo');
  PERFORM pg_temp.no_ve($q$SELECT 1 FROM public.seo_audits WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d3'$q$, 'auditoria de cliente no asignado tras degradar');
  RAISE NOTICE 'OK 8: PM degradado no autoriza una auditoria visible en pendiente_autorizacion (falta manager), conserva member y solo ve clientes asignados';
END $$;

-- ---------- 9. Desactivacion de un usuario con acceso previo ----------
SELECT pg_temp.como('66666666-0000-0000-0000-000000000006');
DO $$ BEGIN
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audits WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'auditoria antes de desactivar');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audit_evidence WHERE audit_id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'evidencias antes de desactivar');
END $$;
RESET ROLE;
UPDATE public.user_access SET status = 'desactivado' WHERE user_id = '66666666-0000-0000-0000-000000000006';
SET LOCAL ROLE authenticated;
SELECT pg_temp.como('66666666-0000-0000-0000-000000000006');
DO $$ BEGIN
  PERFORM pg_temp.no_ve($q$SELECT 1 FROM public.seo_audits$q$, 'auditorias tras desactivar');
  PERFORM pg_temp.no_ve($q$SELECT 1 FROM public.seo_audit_evidence$q$, 'evidencias tras desactivar');
  PERFORM pg_temp.no_ve($q$SELECT 1 FROM public.seo_audit_findings$q$, 'hallazgos tras desactivar');
  PERFORM pg_temp.sin_efecto($q$UPDATE public.seo_audit_findings SET title = 'x' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000b1'$q$, 'desactivado actualiza hallazgos');
  RAISE NOTICE 'OK 9: un usuario desactivado pierde el acceso que tenia justo antes';
END $$;

-- ---------- 10. DELETE denegado en las 10 tablas nuevas ----------
-- 10a. Catalogo: anon no tiene ningun privilegio; authenticated no tiene DELETE, TRUNCATE,
--      REFERENCES ni TRIGGER; y no hay politicas DELETE/ALL.
RESET ROLE;
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['tenants', 'tenant_memberships', 'projects', 'seo_audits', 'seo_audit_access_refs',
    'seo_audit_evidence', 'seo_audit_findings', 'seo_finding_evidence', 'seo_service_coverage', 'seo_audit_state_events']
  LOOP
    IF has_table_privilege('authenticated', 'public.' || tbl, 'DELETE') THEN
      RAISE EXCEPTION 'FALLO: authenticated tiene privilegio DELETE en %', tbl; END IF;
    IF has_table_privilege('authenticated', 'public.' || tbl, 'TRUNCATE, REFERENCES, TRIGGER') THEN
      RAISE EXCEPTION 'FALLO: authenticated tiene TRUNCATE, REFERENCES o TRIGGER en %', tbl; END IF;
    IF has_table_privilege('anon', 'public.' || tbl, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') THEN
      RAISE EXCEPTION 'FALLO: anon tiene algun privilegio en %', tbl; END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl AND cmd IN ('DELETE', 'ALL')) THEN
      RAISE EXCEPTION 'FALLO: existe una politica DELETE/ALL en %', tbl; END IF;
  END LOOP;
END $$;
SET LOCAL ROLE authenticated;
-- 10b. DELETE real sobre filas que PM A ve: debe fallar por falta de privilegio (42501),
-- nunca por una clave foranea (23503) ni por RLS; y la fila debe seguir existiendo.
SELECT pg_temp.como('11111111-0000-0000-0000-000000000001');
DO $$
DECLARE tbl text; cond text;
BEGIN
  FOR tbl, cond IN VALUES
    ('tenants', $c$id = 'aaaaaaaa-0000-0000-0000-00000000000a'$c$),
    ('tenant_memberships', $c$tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a' AND user_id = '11111111-0000-0000-0000-000000000001'$c$),
    ('projects', $c$id = 'aaaaaaaa-0000-0000-0000-0000000000e1'$c$),
    ('seo_audits', $c$id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$c$),
    ('seo_audit_access_refs', $c$id = 'aaaaaaaa-0000-0000-0000-0000000000a1'$c$),
    ('seo_audit_evidence', $c$id = 'aaaaaaaa-0000-0000-0000-0000000000f1'$c$),
    ('seo_audit_findings', $c$id = 'aaaaaaaa-0000-0000-0000-0000000000b1'$c$),
    ('seo_finding_evidence', $c$finding_id = 'aaaaaaaa-0000-0000-0000-0000000000b1'$c$),
    ('seo_service_coverage', $c$audit_id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$c$),
    ('seo_audit_state_events', $c$tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a'$c$)
  LOOP
    PERFORM pg_temp.ve(format('SELECT 1 FROM public.%I WHERE %s', tbl, cond), 'fila visible en ' || tbl || ' antes de DELETE');
    PERFORM pg_temp.rechazado(format('DELETE FROM public.%I WHERE %s', tbl, cond), 'DELETE de fila visible en ' || tbl,
      '42501', 'permission denied for table ' || tbl);
    PERFORM pg_temp.ve(format('SELECT 1 FROM public.%I WHERE %s', tbl, cond), 'fila visible en ' || tbl || ' despues de DELETE');
  END LOOP;
  RAISE NOTICE 'OK 10: DELETE denegado en las 10 tablas (sin privilegio ni politica; DELETE real sobre filas visibles rechazado con 42501); anon sin privilegios';
END $$;

-- ---------- 11. Artefactos inmutables tras validado o cancelado ----------
-- PM A puede cerrar ambas auditorias y sigue viendo sus artefactos, de modo que
-- los rechazos prueban el estado terminal y no una perdida de acceso al cliente.
DO $$ BEGIN
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'en_ejecucion'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'd1 en_cola -> en_ejecucion');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'control_calidad'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'd1 en_ejecucion -> control_calidad');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'validado'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1'$q$, 'd1 control_calidad -> validado');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'cancelado', transition_reason = 'cierre de prueba'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d5'$q$, 'd5 devuelto -> cancelado');
  IF (SELECT state FROM public.seo_audits WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d1') IS DISTINCT FROM 'validado'
     OR (SELECT state FROM public.seo_audits WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d5') IS DISTINCT FROM 'cancelado' THEN
    RAISE EXCEPTION 'FALLO: no se prepararon los dos estados terminales';
  END IF;
  PERFORM pg_temp.terminal_inmutable(
    'aaaaaaaa-0000-0000-0000-0000000000d1',
    'aaaaaaaa-0000-0000-0000-0000000000a1',
    'aaaaaaaa-0000-0000-0000-0000000000b1',
    'aaaaaaaa-0000-0000-0000-0000000000f6',
    'auditoria validada');
  PERFORM pg_temp.terminal_inmutable(
    'aaaaaaaa-0000-0000-0000-0000000000d5',
    'aaaaaaaa-0000-0000-0000-0000000000a5',
    'aaaaaaaa-0000-0000-0000-0000000000b5',
    'aaaaaaaa-0000-0000-0000-0000000000f5',
    'auditoria cancelada');
  RAISE NOTICE 'OK 11: validado y cancelado conservan lectura, pero bloquean todos los INSERT/UPDATE de artefactos hijos sin alterar datos';
END $$;

-- ---------- 12. El rol efectivo limita la gestion de clientes ----------
SELECT pg_temp.como('77777777-0000-0000-0000-000000000007');
DO $$ BEGIN
  IF public.effective_tenant_role('aaaaaaaa-0000-0000-0000-00000000000a') IS DISTINCT FROM 'member' THEN
    RAISE EXCEPTION 'FALLO: el PM global con membresia member no tiene rol efectivo member'; END IF;
  PERFORM pg_temp.rechazado($q$INSERT INTO public.clients (id, nombre, tenant_id) VALUES
    ('aaaaaaaa-0000-0000-0000-0000000000c7', 'Cliente del PM limitado', 'aaaaaaaa-0000-0000-0000-00000000000a')$q$,
    'PM global member crea cliente', '42501', 'new row violates row-level security policy%');
  PERFORM pg_temp.sin_efecto($q$UPDATE public.clients SET nombre = 'modificado por member'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1'$q$, 'PM global member actualiza cliente asignado');
  IF (SELECT nombre FROM public.clients WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1') IS DISTINCT FROM 'Cliente A (prueba)' THEN
    RAISE EXCEPTION 'FALLO: el PM global member modifico un cliente'; END IF;
END $$;
RESET ROLE;
UPDATE public.tenant_memberships SET role = 'manager'
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-00000000000a'
  AND user_id = '77777777-0000-0000-0000-000000000007';
SET LOCAL ROLE authenticated;
SELECT pg_temp.como('77777777-0000-0000-0000-000000000007');
DO $$ BEGIN
  IF NOT public.can_manage_tenant('aaaaaaaa-0000-0000-0000-00000000000a') THEN
    RAISE EXCEPTION 'FALLO: el PM con membresia manager no puede gestionar el tenant'; END IF;
  PERFORM pg_temp.permitido($q$INSERT INTO public.clients (id, nombre, tenant_id) VALUES
    ('aaaaaaaa-0000-0000-0000-0000000000c7', 'Cliente del PM manager', 'aaaaaaaa-0000-0000-0000-00000000000a')$q$,
    'PM global manager crea cliente');
  PERFORM pg_temp.permitido($q$UPDATE public.clients SET nombre = 'Cliente A gestionado'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1'$q$, 'PM global manager actualiza cliente asignado');
  IF (SELECT nombre FROM public.clients WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1') IS DISTINCT FROM 'Cliente A gestionado' THEN
    RAISE EXCEPTION 'FALLO: el PM global manager no modifico el cliente'; END IF;
  RAISE NOTICE 'OK 12: project_manager global + member no gestiona clientes; al elevar la membresia a manager puede crear y actualizar';
END $$;

-- ---------- 13. Archivado reversible de clientes y auditorias (0006) ----------
-- d7: auditoria nueva del cliente A. pm1 es manager; pmd (55555) quedo como member en el
-- escenario 8 y conserva acceso al cliente A.
-- SQLSTATE de 0006: 42501 sin permiso o firma ajena; 23514 cambio combinado;
-- 55000 registro archivado en solo lectura.
RESET ROLE;
INSERT INTO public.seo_audits (id, tenant_id, client_id, project_id, service_ids, requested_by, primary_domain,
  seed_urls, markets, languages, authorized_scope, requested_capability_ids, max_pages, max_duration_minutes,
  max_cost_amount, currency, contract_version) VALUES
  ('aaaaaaaa-0000-0000-0000-0000000000d7', 'aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c1',
   'aaaaaaaa-0000-0000-0000-0000000000e1', ARRAY['seo'], '11111111-0000-0000-0000-000000000001', 'a.test',
   ARRAY['https://a.test/'], ARRAY['ES'], ARRAY['es'], '{}'::jsonb, ARRAY['technical'], 10, 10, 0, 'EUR', 'v1');
SET LOCAL ROLE authenticated;
SELECT pg_temp.como('55555555-0000-0000-0000-000000000005');
DO $$ BEGIN
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET archived_at = now(), archived_by = auth.uid()
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d7'$q$, 'member archiva auditoria', '42501');
  PERFORM pg_temp.sin_efecto($q$UPDATE public.clients SET archived_at = now(), archived_by = auth.uid()
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1'$q$, 'member archiva cliente');
END $$;
SELECT pg_temp.como('11111111-0000-0000-0000-000000000001');
DO $$ BEGIN
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET archived_at = now(), archived_by = '22222222-0000-0000-0000-000000000002'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d7'$q$, 'archivar auditoria en nombre ajeno', '42501');
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET archived_at = now()
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d7'$q$, 'archivar auditoria sin firma', '42501');
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET archived_at = now(), archived_by = auth.uid(), state = 'pendiente_autorizacion'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d7'$q$, 'archivar y cambiar estado a la vez', '23514');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET archived_at = now(), archived_by = auth.uid()
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d7'$q$, 'PM archiva auditoria');
  PERFORM pg_temp.ve($q$SELECT 1 FROM public.seo_audits
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d7' AND archived_at IS NOT NULL$q$, 'auditoria archivada (sigue legible)');
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET state = 'pendiente_autorizacion'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d7'$q$, 'transicion en auditoria archivada', '55000');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET archived_at = NULL, archived_by = NULL
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d7'$q$, 'PM restaura auditoria');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'pendiente_autorizacion'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d7'$q$, 'transicion tras restaurar');

  PERFORM pg_temp.rechazado($q$UPDATE public.clients SET archived_at = now(), archived_by = '22222222-0000-0000-0000-000000000002'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1'$q$, 'archivar cliente en nombre ajeno', '42501');
  PERFORM pg_temp.rechazado($q$UPDATE public.clients SET archived_at = now(), archived_by = auth.uid(), nombre = 'x'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1'$q$, 'archivar cliente y renombrarlo a la vez', '23514');
  PERFORM pg_temp.permitido($q$UPDATE public.clients SET archived_at = now(), archived_by = auth.uid()
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1'$q$, 'PM archiva cliente');
  PERFORM pg_temp.rechazado($q$UPDATE public.clients SET nombre = 'x'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1'$q$, 'modificar cliente archivado', '55000');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.projects (tenant_id, client_id, nombre, primary_domain, created_by) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'x', 'x.test', auth.uid())$q$,
    'proyecto en cliente archivado', '55000');
  PERFORM pg_temp.rechazado($q$INSERT INTO public.seo_audits (tenant_id, client_id, project_id, service_ids, requested_by, primary_domain,
    seed_urls, markets, languages, authorized_scope, requested_capability_ids, max_pages, max_duration_minutes,
    max_cost_amount, currency, contract_version) VALUES
    ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000e1',
     ARRAY['seo'], auth.uid(), 'a.test', ARRAY['https://a.test/'], ARRAY['ES'], ARRAY['es'], '{}'::jsonb,
     ARRAY['technical'], 10, 10, 0, 'EUR', 'v1')$q$, 'auditoria en cliente archivado', '55000');
  PERFORM pg_temp.rechazado($q$UPDATE public.seo_audits SET state = 'devuelto', transition_reason = 'prueba de archivado'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d7'$q$, 'transicion con cliente archivado', '55000');
  PERFORM pg_temp.permitido($q$UPDATE public.clients SET archived_at = NULL, archived_by = NULL
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000c1'$q$, 'PM restaura cliente');
  PERFORM pg_temp.permitido($q$UPDATE public.seo_audits SET state = 'devuelto', transition_reason = 'prueba de archivado'
    WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000d7'$q$, 'transicion tras restaurar el cliente');
  RAISE NOTICE 'OK 13: solo managers archivan y restauran, siempre a su nombre y sin cambios combinados; lo archivado queda en solo lectura y un cliente archivado no admite trabajo nuevo';
END $$;

RESET ROLE;
\echo VERIFICACION COMPLETA
ROLLBACK;
