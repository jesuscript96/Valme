import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";

const code = readFileSync(
  new URL("../../../public/v2/scripts/valme-pilot.js", import.meta.url),
  "utf8",
);
function setup(initial: string | null = null) {
  const values = new Map<string, string>();
  if (initial !== null) values.set("valme-pilot-review-v1", initial);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const window = {} as {
    ValmePilot: {
      createReviewStore: (factory: () => typeof storage) => {
        save: (id: string, decision: string, note: string) => boolean;
        snapshot: () => Record<string, { note: string; decision: string }>;
        error: () => string;
      };
    };
  };
  runInNewContext(code, { window });
  return { values, storage, create: () => window.ValmePilot.createReviewStore(() => storage) };
}
test("pilot decisions persist independently of demo records", () => {
  const { create, values } = setup();
  const store = create();
  assert.equal(store.save("VALME-01", "priorizar", "Revisar oferta"), true);
  assert.equal(create().snapshot()["VALME-01"].note, "Revisar oferta");
  assert.equal(values.has("valme-demo-seo-audits-v1"), false);
});
test("unknown and corrupt pilot storage is never overwritten", () => {
  for (const raw of [
    '{"schemaVersion":2}',
    "broken",
    '{"schemaVersion":1,"auditId":"VALME-PILOTO-2026-09-27","reviews":{"VALME-01":null}}',
  ]) {
    const { create, values } = setup(raw);
    const store = create();
    assert.ok(store.error());
    assert.equal(store.save("VALME-01", "priorizar", "note"), false);
    assert.equal(values.get("valme-pilot-review-v1"), raw);
  }
});
test("failed writes do not claim a saved review", () => {
  const { create, storage } = setup();
  const store = create();
  storage.setItem = () => {
    throw new Error("quota");
  };
  assert.equal(store.save("VALME-01", "priorizar", "note"), false);
  assert.equal(Object.keys(store.snapshot()).length, 0);
  assert.ok(store.error());
});
test("conflicting tabs cannot silently overwrite each other", () => {
  const { create } = setup();
  const a = create();
  const b = create();
  assert.equal(a.save("VALME-01", "priorizar", "first"), true);
  assert.equal(b.save("VALME-02", "descartar", "second"), false);
  assert.equal(create().snapshot()["VALME-01"].note, "first");
});
test("invalid reviews and oversized notes are rejected", () => {
  const { create } = setup();
  const store = create();
  assert.equal(store.save("other", "priorizar", ""), false);
  assert.equal(store.save("VALME-01", "publish", ""), false);
  assert.equal(store.save("VALME-01", "priorizar", "x".repeat(3001)), false);
  assert.equal(Object.keys(store.snapshot()).length, 0);
});

test("the pilot import payload is accepted verbatim by the server contract", async () => {
  const { importSeoAuditReviewInputSchema } = await import("./repository.server");
  const evidenceJson = JSON.parse(
    readFileSync(new URL("../../../public/v2/valme-pilot-evidence.json", import.meta.url), "utf8"),
  ) as { pages: unknown[] };
  const window = {} as {
    ValmePilot: {
      domain: string;
      findingCount: number;
      importPayload: (auditId: string, json: unknown) => unknown;
    };
  };
  runInNewContext(code, { window, URL });
  const auditId = "10000000-0000-4000-8000-000000000001";
  // El objeto viene de otro contexto vm: normalizar antes de validar.
  const payload = JSON.parse(
    JSON.stringify(window.ValmePilot.importPayload(auditId, evidenceJson)),
  );
  const parsed = importSeoAuditReviewInputSchema.parse(payload);

  assert.equal(window.ValmePilot.domain, "valmesolutions.com");
  assert.equal(parsed.findings.length, window.ValmePilot.findingCount);
  assert.equal(parsed.evidence.length, evidenceJson.pages.length);
  assert.equal(parsed.reviewer.name, "Revisión externa (Codex)");
  const keys = new Set(parsed.evidence.map((item) => item.key));
  for (const finding of parsed.findings) {
    assert.ok(finding.evidenceKeys.length > 0, `${finding.title} sin evidencia`);
    for (const key of finding.evidenceKeys) assert.ok(keys.has(key), `${key} inexistente`);
    assert.doesNotMatch(finding.impact, /\d+\s*%/, "Los impactos no inventan cifras");
  }
  assert.throws(() => window.ValmePilot.importPayload(auditId, { pages: [] }), /vacío/);
});
