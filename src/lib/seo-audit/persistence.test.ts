import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ALLOWED_TRANSITIONS } from "./states";
import type { SeoAuditState } from "./types";

const migrationUrl = new URL(
  "../../../drizzle/migrations/0005_seo_audit_persistence.sql",
  import.meta.url,
);
const journalUrl = new URL("../../../drizzle/migrations/meta/_journal.json", import.meta.url);
const snapshotUrl = new URL("../../../drizzle/migrations/meta/0005_snapshot.json", import.meta.url);
const migration = readFileSync(migrationUrl, "utf8");

const tenantTables = [
  "tenants",
  "tenant_memberships",
  "projects",
  "seo_audits",
  "seo_audit_access_refs",
  "seo_audit_evidence",
  "seo_audit_findings",
  "seo_finding_evidence",
  "seo_service_coverage",
  "seo_audit_state_events",
] as const;

describe("SEO audit persistence migration", () => {
  it("enables RLS on every new tenant-owned table", () => {
    for (const table of tenantTables) {
      assert.match(
        migration,
        new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`),
      );
    }
  });

  it("uses tenant-scoped foreign keys for the project and audit hierarchy", () => {
    assert.match(
      migration,
      /FOREIGN KEY \(client_id, tenant_id\)\s+REFERENCES public\.clients\(id, tenant_id\)/,
    );
    assert.match(
      migration,
      /FOREIGN KEY \(project_id, tenant_id, client_id\)\s+REFERENCES public\.projects\(id, tenant_id, client_id\)/,
    );
    assert.match(
      migration,
      /FOREIGN KEY \(audit_id, tenant_id\)\s+REFERENCES public\.seo_audits\(id, tenant_id\)/,
    );
  });

  it("keeps access records reference-only", () => {
    const accessTable = migration.match(
      /CREATE TABLE public\.seo_audit_access_refs \(([\s\S]*?)\n\);/,
    );
    assert.ok(accessTable, "No se encontro la tabla seo_audit_access_refs");
    const accessTableBody = accessTable[1];
    assert.ok(accessTableBody);
    assert.doesNotMatch(
      accessTableBody,
      /^\s*(?:secret|password|token|credential|api_key)\s+(?:text|varchar|jsonb)/im,
    );
    assert.match(accessTableBody, /^\s*access_ref text NOT NULL,/m);
  });

  it("revokes Supabase default privileges before granting the minimum", () => {
    const tables = [
      "tenants",
      "tenant_memberships",
      "projects",
      "seo_audits",
      "seo_audit_access_refs",
      "seo_audit_evidence",
      "seo_audit_findings",
      "seo_finding_evidence",
      "seo_service_coverage",
      "seo_audit_state_events",
    ];
    const revoke = migration.match(
      /REVOKE ALL ON (public\.[\s\S]*?)FROM PUBLIC, anon, authenticated;/,
    );
    assert.ok(revoke?.[1], "Falta REVOKE ALL ... FROM PUBLIC, anon, authenticated");
    for (const table of tables) assert.match(revoke[1], new RegExp(`public\\.${table}\\b`));
    assert.ok(migration.indexOf(revoke[0]) < migration.indexOf("GRANT SELECT ON public.tenants"));
    assert.doesNotMatch(migration, /GRANT[^;]*TO[^;]*\banon\b/gi);
  });

  it("does not grant DELETE to authenticated users", () => {
    assert.doesNotMatch(migration, /GRANT[^;]*DELETE[^;]*TO authenticated/gi);
  });

  it("keeps SQL transitions aligned with the TypeScript state machine", () => {
    const transitionBody = migration.match(
      /CREATE OR REPLACE FUNCTION public\.seo_audit_transition_allowed[\s\S]*?AS \$\$([\s\S]*?)\$\$;/,
    );
    assert.ok(transitionBody, "No se encontro seo_audit_transition_allowed");
    const transitionSql = transitionBody[1];
    assert.ok(transitionSql);

    for (const [from, expected] of Object.entries(ALLOWED_TRANSITIONS) as [
      SeoAuditState,
      SeoAuditState[],
    ][]) {
      if (expected.length === 0) {
        assert.doesNotMatch(transitionSql, new RegExp(`WHEN '${from}'`));
        continue;
      }

      const statePattern: RegExp = new RegExp(`WHEN '${from}' THEN _to IN \\(([^)]*)\\)`);
      const stateMatch: RegExpMatchArray | null = transitionSql.match(statePattern);
      assert.ok(stateMatch, `Falta la transicion SQL para ${from}`);
      const stateTargets: string | undefined = stateMatch[1];
      assert.ok(stateTargets);
      const actual: string[] = [...stateTargets.matchAll(/'([^']+)'/g)].flatMap((item) =>
        item[1] ? [item[1]] : [],
      );
      assert.deepEqual(actual, expected);
    }
  });

  it("is registered as the next Drizzle migration", () => {
    const journal = JSON.parse(readFileSync(journalUrl, "utf8")) as {
      entries: Array<Record<string, unknown>>;
    };
    assert.deepEqual(journal.entries[5], {
      idx: 5,
      version: "7",
      when: 1790300000000,
      tag: "0005_seo_audit_persistence",
      breakpoints: true,
    });

    const snapshot = JSON.parse(readFileSync(snapshotUrl, "utf8")) as {
      prevId: string;
      tables: Record<string, unknown>;
    };
    assert.equal(snapshot.prevId, "90ba1e30-168b-43a9-96c5-4bf2437a7bbc");
    assert.deepEqual(snapshot.tables, {});
  });

  it("derives demo memberships only from active internal users and keeps them in sync", () => {
    assert.match(
      migration,
      /WHERE ua\.status = 'activo'\s+AND ua\.role IN \('super_admin', 'project_manager', 'equipo'\)/,
    );
    assert.doesNotMatch(migration, /ELSE 'reviewer'::public\.tenant_role/);
    assert.doesNotMatch(migration, /user_roles/);
    assert.match(
      migration,
      /AFTER INSERT OR UPDATE OF role, status OR DELETE ON public\.user_access/,
    );
    assert.match(migration, /AND ua\.status = 'activo'/);
  });

  it("requires internal access for evidence, access refs and history", () => {
    for (const table of [
      "seo_audit_access_refs",
      "seo_audit_evidence",
      "seo_finding_evidence",
      "seo_audit_state_events",
    ]) {
      assert.match(
        migration,
        new RegExp(
          `ON public\\.${table}\\s+FOR SELECT TO authenticated USING \\(public\\.is_internal\\(\\) AND`,
        ),
      );
    }
  });

  // Comprobaciones estaticas del texto SQL. La prueba real de permisos es
  // scripts/staging/verify_seo_audit_rls.sql, ejecutado contra PostgreSQL.
  it("computes the effective tenant role as the lower of tenant and global role", () => {
    assert.match(
      migration,
      /LEAST\(public\.tenant_role_rank\(tm\.role\), public\.valme_role_rank\(ua\.role\)\)/,
    );
    assert.match(migration, /WHEN 'cliente' THEN 1/);
    assert.match(
      migration,
      /COALESCE\(public\.effective_tenant_role\(_tenant_id\) = ANY\(_roles\), false\)/,
    );
  });

  it("keeps terminal audit artifacts immutable without hiding them", () => {
    const readBody = migration.match(
      /CREATE OR REPLACE FUNCTION public\.can_read_seo_audit[\s\S]*?AS \$\$([\s\S]*?)\$\$;/,
    );
    const writeBody = migration.match(
      /CREATE OR REPLACE FUNCTION public\.can_write_seo_audit[\s\S]*?AS \$\$([\s\S]*?)\$\$;/,
    );
    assert.ok(readBody?.[1]);
    assert.ok(writeBody?.[1]);
    assert.doesNotMatch(readBody[1], /state NOT IN \('validado', 'cancelado'\)/);
    assert.match(writeBody[1], /a\.state NOT IN \('validado', 'cancelado'\)/);
  });

  it("requires the effective tenant manager role to create or update clients", () => {
    assert.match(
      migration,
      /FOR INSERT TO authenticated\s+WITH CHECK \(public\.can_manage_tenant\(tenant_id\) AND public\.can_manage_clients\(\)\);/,
    );
    assert.match(
      migration,
      /FOR UPDATE TO authenticated\s+USING \(public\.can_manage_tenant\(tenant_id\) AND public\.can_manage_clients\(\) AND public\.has_client_access\(id\)\)\s+WITH CHECK \(public\.can_manage_tenant\(tenant_id\) AND public\.can_manage_clients\(\) AND public\.has_client_access\(id\)\);/,
    );
  });

  it("does not allow devuelto to jump to an executable state", () => {
    assert.match(
      migration,
      /WHEN 'devuelto' THEN _to IN \('borrador', 'pendiente_autorizacion', 'cancelado'\)/,
    );
  });

  it("only sets authorization during pendiente_autorizacion -> autorizado and invalidates it on scope change", () => {
    assert.match(
      migration,
      /_authorizing := NEW\.state = 'autorizado' AND OLD\.state = 'pendiente_autorizacion';/,
    );
    assert.match(migration, /IF NOT _authorizing AND \(/);
    assert.match(migration, /OLD\.state = 'devuelto' AND _scope_changed/);
    assert.match(migration, /NEW\.authorized_by := NULL;/);
    assert.match(migration, /Una auditoria nueva no puede nacer autorizada/);
  });

  it("ships a reproducible staging script that ends in ROLLBACK", () => {
    const script = readFileSync(
      new URL("../../../scripts/staging/verify_seo_audit_rls.sql", import.meta.url),
      "utf8",
    );
    assert.match(script, /^BEGIN;$/m);
    assert.match(script.trimEnd(), /ROLLBACK;$/);
    for (let n = 1; n <= 15; n++) assert.match(script, new RegExp(`OK ${n}:`));
    assert.match(script, /\\echo VERIFICACION COMPLETA/);
  });

  // Comprobaciones textuales del contrato del verificador. No ejecutan SQL: el
  // resultado real solo lo da ejecutar el guion contra PostgreSQL.
  it("registers 0006 (archivado) right after 0005 in the Drizzle journal", () => {
    const journal = JSON.parse(readFileSync(journalUrl, "utf8")) as {
      entries: Array<Record<string, unknown>>;
    };
    assert.equal(journal.entries[6]?.["idx"], 6);
    assert.equal(journal.entries[6]?.["tag"], "0006_archive_clients_audits");
    assert.equal(journal.entries[7]?.["tag"], "0007_finding_review");
    assert.equal(journal.entries.at(-1)?.["tag"], "0008_finding_actions");
    const snapshot0005 = JSON.parse(readFileSync(snapshotUrl, "utf8")) as { id: string };
    const snapshot0006 = JSON.parse(
      readFileSync(
        new URL("../../../drizzle/migrations/meta/0006_snapshot.json", import.meta.url),
        "utf8",
      ),
    ) as { prevId: string };
    assert.equal(snapshot0006.prevId, snapshot0005.id);
  });

  it("chains the 0007 snapshot after 0006", () => {
    const read = (name: string) =>
      JSON.parse(
        readFileSync(new URL(`../../../drizzle/migrations/meta/${name}`, import.meta.url), "utf8"),
      ) as { id: string; prevId: string };
    assert.equal(read("0007_snapshot.json").prevId, read("0006_snapshot.json").id);
    assert.equal(read("0008_snapshot.json").prevId, read("0007_snapshot.json").id);
  });

  it("declares a verifier contract that requires an explicit SQLSTATE for every denial", () => {
    const script = readFileSync(
      new URL("../../../scripts/staging/verify_seo_audit_rls.sql", import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(script, /pg_temp\.bloqueado/);
    assert.match(
      script,
      /CREATE FUNCTION pg_temp\.rechazado\(_q text, _label text, _sqlstate text, _msg text DEFAULT NULL\)/,
    );
    assert.match(script, /GET STACKED DIAGNOSTICS st = RETURNED_SQLSTATE/);
    assert.match(script, /IF st IS DISTINCT FROM _sqlstate/);
    assert.doesNotMatch(script, /EXCEPTION WHEN OTHERS THEN\s+RETURN;/);
    const calls = [...script.matchAll(/PERFORM pg_temp\.rechazado\(([\s\S]*?)\);\r?\n/g)].map(
      (m) => m[1] ?? "",
    );
    assert.ok(calls.length > 0);
    for (const call of calls) assert.match(call, /'(42501|P0001|23514|55000)'/);
  });

  it("covers DELETE by catalog privilege and by real attempts on visible rows", () => {
    const script = readFileSync(
      new URL("../../../scripts/staging/verify_seo_audit_rls.sql", import.meta.url),
      "utf8",
    );
    assert.match(script, /has_table_privilege\('authenticated', 'public\.' \|\| tbl, 'DELETE'\)/);
    assert.match(script, /cmd IN \('DELETE', 'ALL'\)/);
    assert.match(script, /'permission denied for table ' \|\| tbl/);
    for (const table of tenantTables) assert.match(script, new RegExp(`\\('${table}', \\$c\\$`));
  });

  it("runs cross-tenant negatives in both directions and a visible pending audit for the demoted PM", () => {
    const script = readFileSync(
      new URL("../../../scripts/staging/verify_seo_audit_rls.sql", import.meta.url),
      "utf8",
    );
    assert.match(script, /pg_temp\.cruzado\([\s\S]*?'PM A contra tenant B'\)/);
    assert.match(script, /pg_temp\.cruzado\([\s\S]*?'PM B contra tenant A'\)/);
    assert.match(
      script,
      /'PM degradado autoriza', 'P0001', 'La transicion a autorizado requiere rol owner o manager'/,
    );
    assert.match(script, /PM deja d5 en pendiente_autorizacion/);
  });

  it("tests terminal artifact immutability and the tenant role ceiling against PostgreSQL", () => {
    const script = readFileSync(
      new URL("../../../scripts/staging/verify_seo_audit_rls.sql", import.meta.url),
      "utf8",
    );
    assert.match(script, /pg_temp\.terminal_inmutable\([\s\S]*?'auditoria validada'\)/);
    assert.match(script, /pg_temp\.terminal_inmutable\([\s\S]*?'auditoria cancelada'\)/);
    assert.match(script, /'PM global member crea cliente', '42501'/);
    assert.match(script, /'PM global manager crea cliente'/);
    assert.match(script, /'PM global manager actualiza cliente asignado'/);
  });

  it("tests the reviewer write-denial matrix in its own tenant", () => {
    const script = readFileSync(
      new URL("../../../scripts/staging/verify_seo_audit_rls.sql", import.meta.url),
      "utf8",
    );
    for (const label of [
      "tenant",
      "membresia",
      "cliente",
      "proyecto",
      "auditoria",
      "referencia de acceso",
      "evidencia",
      "hallazgo",
      "enlace",
      "cobertura",
      "evento",
    ]) {
      assert.match(script, new RegExp(`cliente (?:crea|enlaza|actualiza) ${label}`));
    }
  });
});
