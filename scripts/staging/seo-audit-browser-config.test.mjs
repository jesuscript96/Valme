import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { browserConfig } from "./seo-audit-browser-config.mjs";

const actors = {
  a: {
    email: "a@example.test",
    password: "synthetic",
    projectId: "11111111-1111-4111-8111-111111111111",
  },
  b: {
    email: "b@example.test",
    password: "synthetic",
    projectId: "22222222-2222-4222-8222-222222222222",
  },
  member: {
    email: "member@example.test",
    password: "synthetic",
    projectId: "11111111-1111-4111-8111-111111111111",
  },
};
const env = {
  STAGING_SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
  STAGING_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  STAGING_E2E_ACTORS: JSON.stringify(actors),
};
test("accepts complete isolated fixture configuration", () => {
  assert.equal(browserConfig(env).url, "https://abcdefghijklmnopqrst.supabase.co");
});
test("rejects production before opening a browser", () => {
  const config = readFileSync(new URL("../../supabase/config.toml", import.meta.url), "utf8");
  const ref = config.match(/project_id\s*=\s*"([^"]+)"/)[1];
  assert.throws(
    () => browserConfig({ ...env, STAGING_SUPABASE_PROJECT_REF: ref }),
    /Invalid staging target/,
  );
});
test("rejects missing secrets and privileged keys without exposing values", () => {
  assert.throws(() => browserConfig({}), /Missing STAGING_SUPABASE_PROJECT_REF/);
  assert.throws(
    () => browserConfig({ ...env, STAGING_SUPABASE_PUBLISHABLE_KEY: "sb_secret_hidden" }),
    /Use a staging publishable key/,
  );
  assert.throws(
    () => browserConfig({ ...env, STAGING_E2E_ACTORS: "sensitive-invalid-value" }),
    /Invalid actor configuration/,
  );
});
test("rejects shared accounts and vacuous tenant fixtures", () => {
  assert.throws(
    () => browserConfig({ ...env, STAGING_E2E_ACTORS: JSON.stringify({ ...actors, b: actors.a }) }),
    /Expected distinct users/,
  );
  assert.throws(
    () =>
      browserConfig({
        ...env,
        STAGING_E2E_ACTORS: JSON.stringify({
          ...actors,
          member: { ...actors.member, projectId: actors.b.projectId },
        }),
      }),
    /Expected distinct users/,
  );
});
