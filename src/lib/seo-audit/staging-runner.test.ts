import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  assertApplyConfirmation,
  assertStagingTarget,
  prepareVerifierSql,
  projectRefsFromDatabaseUrl,
  readProductionProjectRef,
  safeErrorMessage,
} from "../../../scripts/staging/seo-audit-staging.mjs";

const production = "rkejzxlpfkciwsuevmxv";
const staging = "abcdefghijklmnopqrst";

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
});
