import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
// @ts-expect-error -- módulo ESM de scripts sin declaraciones de tipos.
import { devStagingEnv, parseEnvFile } from "../../../scripts/staging/dev-staging.mjs";
// @ts-expect-error -- módulo ESM de scripts sin declaraciones de tipos.
import { assertGrantInput } from "../../../scripts/staging/grant-staging-admin.mjs";

const production = readFileSync(new URL("../../../supabase/config.toml", import.meta.url), "utf8");
const staging = "abcdefghijklmnopqrst";
const productionRef = production.match(/^project_id\s*=\s*"([a-z0-9]+)"/m)?.[1] ?? "";

describe("staging developer tools", () => {
  it("reads a simple env file without exposing comments or quotes", () => {
    assert.deepEqual(
      parseEnvFile(
        '# comentario\nSTAGING_SUPABASE_PROJECT_REF="abcdefghijklmnopqrst"\r\nSTAGING_SUPABASE_PUBLISHABLE_KEY = sb_publishable_x\n',
      ),
      {
        STAGING_SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
        STAGING_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
      },
    );
  });

  it("points the dev server only at staging, with remote mode on and no admin key", () => {
    const { env, url } = devStagingEnv(
      {
        STAGING_SUPABASE_PROJECT_REF: staging,
        STAGING_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
      },
      { SUPABASE_URL: "https://prod.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "secreto", PATH: "p" },
      production,
    );
    assert.equal(url, `https://${staging}.supabase.co`);
    assert.equal(env.SUPABASE_URL, url);
    assert.equal(env.VITE_SUPABASE_URL, url);
    assert.equal(env.SEO_AUDIT_REMOTE_ENABLED, "true");
    assert.equal(env.SEO_AUDIT_REMOTE_ENVIRONMENT, "staging");
    assert.equal(env.SEO_AUDIT_REMOTE_PROJECT_REF, staging);
    assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, undefined);
    assert.equal(env.PATH, "p");
  });

  it("refuses production, malformed refs and non-publishable keys", () => {
    assert.ok(productionRef, "config.toml debe declarar el project_id de produccion");
    const key = "sb_publishable_x";
    assert.throws(
      () =>
        devStagingEnv(
          {
            STAGING_SUPABASE_PROJECT_REF: productionRef,
            STAGING_SUPABASE_PUBLISHABLE_KEY: key,
          },
          {},
          production,
        ),
      /produccion/,
    );
    assert.throws(
      () =>
        devStagingEnv(
          { STAGING_SUPABASE_PROJECT_REF: "corto", STAGING_SUPABASE_PUBLISHABLE_KEY: key },
          {},
          production,
        ),
      /formato/,
    );
    assert.throws(
      () =>
        devStagingEnv(
          {
            STAGING_SUPABASE_PROJECT_REF: staging,
            STAGING_SUPABASE_PUBLISHABLE_KEY: "sb_secret_x",
          },
          {},
          production,
        ),
      /publicable/,
    );
  });

  it("requires an email and an explicit confirmation tied to the staging project", () => {
    assert.throws(() => assertGrantInput("", staging, `grant-admin-in-${staging}`), /correo/);
    assert.throws(() => assertGrantInput("pm@valme.test", staging, "si"), /STAGING_GRANT_CONFIRM/);
    assert.doesNotThrow(() =>
      assertGrantInput("pm@valme.test", staging, `grant-admin-in-${staging}`),
    );
  });
});
