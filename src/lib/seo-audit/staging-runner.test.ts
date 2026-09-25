import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  assertApplyConfirmation,
  assertStagingTarget,
  extractPrivilegesBlock,
  prepareVerifierSql,
  projectRefsFromDatabaseUrl,
  readProductionProjectRef,
  safeErrorMessage,
} from "../../../scripts/staging/seo-audit-staging.mjs";

const production = "rkejzxlpfkciwsuevmxv";
const migration = readFileSync(
  new URL("../../../drizzle/migrations/0005_seo_audit_persistence.sql", import.meta.url),
  "utf8",
);
const staging = "abcdefghijklmnopqrst";
const workflow = readFileSync(
  new URL("../../../.github/workflows/seo-audit-staging.yml", import.meta.url),
  "utf8",
);
const ciWorkflow = readFileSync(
  new URL("../../../.github/workflows/ci.yml", import.meta.url),
  "utf8",
);

describe("SEO audit staging runner", () => {
  it("reads the production project ref from the tracked Supabase config", async () => {
    assert.equal(await readProductionProjectRef(), production);
  });

  it("recognizes direct and pooled Supabase database URLs", () => {
    assert.deepEqual(
      [
        ...projectRefsFromDatabaseUrl(
          `postgresql://postgres:secret@db.${staging}.supabase.co/postgres`,
        ),
      ],
      [staging],
    );
    assert.deepEqual(
      [
        ...projectRefsFromDatabaseUrl(
          `postgresql://postgres.${staging}:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
        ),
      ],
      [staging],
    );
  });

  it("rejects production, mismatched and unprovable targets", () => {
    assert.throws(
      () =>
        assertStagingTarget({
          databaseUrl: `postgresql://postgres:secret@db.${production}.supabase.co/postgres`,
          stagingProjectRef: production,
          productionProjectRef: production,
        }),
      /coincide con produccion/,
    );
    assert.throws(
      () =>
        assertStagingTarget({
          databaseUrl: `postgresql://postgres:secret@db.${staging}.supabase.co/postgres`,
          stagingProjectRef: "differentstagingref12",
          productionProjectRef: production,
        }),
      /no demuestra/,
    );
    assert.throws(
      () =>
        assertStagingTarget({
          databaseUrl: `postgresql://postgres.${staging}:secret@database.example/postgres`,
          stagingProjectRef: staging,
          productionProjectRef: production,
        }),
      /no demuestra/,
    );
    assert.throws(
      () =>
        assertStagingTarget({
          databaseUrl: "postgresql://postgres:secret@localhost/postgres",
          stagingProjectRef: staging,
          productionProjectRef: production,
        }),
      /no demuestra/,
    );
  });

  it("accepts a staging URL only when its declared ref matches", () => {
    assert.equal(
      assertStagingTarget({
        databaseUrl: `postgresql://postgres:secret@db.${staging}.supabase.co/postgres`,
        stagingProjectRef: staging,
        productionProjectRef: production,
      }),
      staging,
    );
  });

  it("requires an apply confirmation tied to the staging project", () => {
    assert.throws(() => assertApplyConfirmation(staging, "apply-0005"), /apply-0005-to-/);
    assert.doesNotThrow(() => assertApplyConfirmation(staging, `apply-0005-to-${staging}`));
  });

  it("redacts the connection URL and password from errors", () => {
    const databaseUrl = `postgresql://postgres.${staging}:very-secret@aws-0-eu-west-1.pooler.supabase.com/postgres`;
    const message = safeErrorMessage(
      new Error(`fallo con ${databaseUrl}: very-secret`),
      databaseUrl,
    );

    assert.doesNotMatch(message, /very-secret|postgresql:/);
    assert.match(message, /\[redacted\]/);
  });

  it("adapts the psql verifier without weakening its rollback contract", () => {
    const source = readFileSync(
      new URL("../../../scripts/staging/verify_seo_audit_rls.sql", import.meta.url),
      "utf8",
    );
    const prepared = prepareVerifierSql(source);

    assert.doesNotMatch(prepared, /^\s*\\/m);
    assert.match(prepared, /RAISE NOTICE 'VERIFICACION COMPLETA'/);
    assert.match(prepared, /ROLLBACK;/);
    for (let scenario = 1; scenario <= 12; scenario += 1) {
      assert.match(prepared, new RegExp(`OK ${scenario}:`));
    }
  });

  it("fails closed on unsupported psql metacommands", () => {
    assert.throws(() => prepareVerifierSql("\\include otro.sql"), /metacomando psql/);
  });

  it("reconciles 0005 privileges from a single idempotent block", () => {
    const block = extractPrivilegesBlock(migration);
    assert.match(
      block,
      /^REVOKE ALL ON public\.tenants,[\s\S]*?FROM PUBLIC, anon, authenticated;/m,
    );
    assert.ok(
      block.indexOf("REVOKE ALL ON public.tenants") <
        block.indexOf("GRANT SELECT ON public.tenants"),
      "El REVOKE debe preceder a los GRANT",
    );
    assert.doesNotMatch(block, /CREATE|DROP|ALTER|INSERT INTO|UPDATE public|DELETE FROM/i);
    assert.throws(
      () => extractPrivilegesBlock("GRANT SELECT ON x TO authenticated;"),
      /bloque de privilegios/,
    );
  });

  it("keeps the staging workflow manual, serialized and environment-protected", () => {
    assert.match(workflow, /workflow_dispatch:/);
    assert.doesNotMatch(workflow, /^\s*(push|pull_request|schedule):/m);
    assert.match(workflow, /environment: staging/);
    assert.match(workflow, /cancel-in-progress: false/);
    assert.match(workflow, /secrets\.STAGING_DB_URL/);
    assert.match(workflow, /vars\.STAGING_SUPABASE_PROJECT_REF/);
    assert.match(workflow, /APPLY-0005-STAGING/);
    assert.match(workflow, /uses: oven-sh\/setup-bun@v2/);
    assert.match(workflow, /run: bun install --frozen-lockfile/);
    assert.match(workflow, /run: bun test/);
    assert.match(workflow, /run: bun run staging:seo-audit:preflight/);
    assert.match(workflow, /supabase@2\.118\.0 gen types typescript/);
    assert.match(workflow, /uses: actions\/upload-artifact@v4/);
    assert.match(workflow, /name: supabase-types-staging/);
    assert.match(workflow, /retention-days: 1/);
    assert.doesNotMatch(workflow, /PRODUCTION_DB|SUPABASE_ACCESS_TOKEN|service_role/i);
  });

  it("runs tests and a production build for pull requests and main", () => {
    assert.match(ciWorkflow, /pull_request:/);
    assert.match(ciWorkflow, /branches:\s*\n\s*- main/);
    assert.match(ciWorkflow, /permissions:\s*\n\s*contents: read/);
    assert.match(ciWorkflow, /cancel-in-progress: true/);
    assert.match(ciWorkflow, /uses: oven-sh\/setup-bun@v2/);
    assert.match(ciWorkflow, /run: bun install --frozen-lockfile/);
    assert.match(ciWorkflow, /run: bun test/);
    assert.match(ciWorkflow, /run: bun run build/);
    assert.doesNotMatch(ciWorkflow, /secrets\.|STAGING_DB_URL|PRODUCTION_DB/i);
  });
});
