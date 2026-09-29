import assert from "node:assert/strict";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SeoAuditDatabase } from "./repository.server";
import { runFindingProbe } from "./agent-run.server";

test("agent fails closed before touching storage when remote mode is off", async () => {
  const previous = process.env.SEO_AUDIT_REMOTE_ENABLED;
  process.env.SEO_AUDIT_REMOTE_ENABLED = "false";
  try {
    await assert.rejects(runFindingProbe({} as SupabaseClient<SeoAuditDatabase>, "user", "action"));
  } finally {
    if (previous === undefined) delete process.env.SEO_AUDIT_REMOTE_ENABLED;
    else process.env.SEO_AUDIT_REMOTE_ENABLED = previous;
  }
});

test("client users cannot cause a network request", async () => {
  const keys = [
    "SEO_AUDIT_REMOTE_ENABLED",
    "SEO_AUDIT_REMOTE_ENVIRONMENT",
    "SEO_AUDIT_REMOTE_PROJECT_REF",
    "SUPABASE_URL",
  ] as const;
  const before = keys.map((key) => process.env[key]);
  Object.assign(process.env, {
    SEO_AUDIT_REMOTE_ENABLED: "true",
    SEO_AUDIT_REMOTE_ENVIRONMENT: "staging",
    SEO_AUDIT_REMOTE_PROJECT_REF: "test",
    SUPABASE_URL: "https://test.supabase.co",
  });
  let fetched = false;
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data: { role: "cliente", status: "activo" }, error: null }),
  };
  const client = { from: () => query } as unknown as SupabaseClient<SeoAuditDatabase>;
  try {
    await assert.rejects(
      runFindingProbe(client, "user", "action", async () => {
        fetched = true;
        return "";
      }),
      /PM activo/,
    );
    assert.equal(fetched, false);
  } finally {
    keys.forEach((key, index) => {
      const value = before[index];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});
