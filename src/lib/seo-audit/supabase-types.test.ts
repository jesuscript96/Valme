import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const types = readFileSync(
  new URL("../../integrations/supabase/seo-audit-staging.types.ts", import.meta.url),
  "utf8",
);

const auditTables = [
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

describe("generated Supabase types", () => {
  it("contains every tenant-owned SEO audit table from staging", () => {
    for (const table of auditTables) {
      assert.match(types, new RegExp(`^\\s{6}${table}: \\{`, "m"), `Falta ${table}`);
    }
  });

  it("contains the governed audit enums and tenant helpers", () => {
    assert.match(types, /tenant_role: "owner" \| "manager" \| "member" \| "reviewer";/);
    assert.match(types, /seo_audit_state:\s*\| "borrador"[\s\S]*?\| "cancelado";/);
    for (const fn of [
      "effective_tenant_role",
      "has_tenant_role",
      "can_read_seo_audit",
      "can_write_seo_audit",
    ]) {
      assert.match(types, new RegExp(`^\\s{6}${fn}:`, "m"), `Falta ${fn}`);
    }
  });

  it("does not embed project identifiers or connection material", () => {
    assert.doesNotMatch(
      types,
      /postgres(?:ql)?:|supabase\.co|edsdbkdjbyxbwukgnfid|rkejzxlpfkciwsuevmxv/i,
    );
  });
});
