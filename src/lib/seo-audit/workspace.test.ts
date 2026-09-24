import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ALLOWED_TRANSITIONS } from "./states";

const workspace = readFileSync(
  new URL("../../../public/v2/scripts/auditorias.js", import.meta.url),
  "utf8",
);
const repository = readFileSync(
  new URL("../../../public/v2/scripts/auditorias-repository.js", import.meta.url),
  "utf8",
);
const app = readFileSync(new URL("../../../public/v2/scripts/app.js", import.meta.url), "utf8");
const shell = readFileSync(new URL("../v2/shell.html", import.meta.url), "utf8");

const states = [
  "borrador",
  "pendiente_autorizacion",
  "autorizado",
  "en_cola",
  "en_ejecucion",
  "bloqueado",
  "control_calidad",
  "devuelto",
  "validado",
  "cancelado",
] as const;

describe("SEO audit V2 workspace", () => {
  it("is connected to the desktop and mobile navigation", () => {
    assert.match(app, /const sections=\[[^\]]*'Auditorías'/);
    assert.match(app, /'Auditorías':\(\)=>auditsWorkspace\(\)/);
    assert.ok(
      shell.indexOf("/v2/scripts/auditorias-repository.js") <
        shell.indexOf("/v2/scripts/auditorias.js"),
    );
    assert.match(shell, /<script src="\/v2\/scripts\/auditorias\.js"><\/script>/);
  });

  it("represents every governed audit state", () => {
    for (const state of states) {
      assert.match(workspace, new RegExp(`['"]${state}['"]`));
    }
    assert.match(workspace, /const SEO_AUDIT_NEXT =/);
    assert.match(workspace, /const SEO_AUDIT_ACTIONS =/);
  });

  it("keeps every local transition aligned with the domain contract", () => {
    for (const [state, nextStates] of Object.entries(ALLOWED_TRANSITIONS)) {
      const sequence = nextStates.map((next) => `["']${next}["']`).join(",\\s*");
      assert.match(workspace, new RegExp(`${state}: \\[${sequence}\\]`));
    }
  });

  it("creates new work as a draft", () => {
    assert.match(workspace, /state:\s*["']borrador["']/);
    assert.match(workspace, /El encargo nace como borrador/);
    assert.match(workspace, /class="v-primary" type="submit">Guardar borrador/);
    assert.match(app, /if\(!b\.hasAttribute\('type'\)\)b\.type='button'/);
    assert.doesNotMatch(workspace, /state:\s*form\.get/);
  });

  it("routes local persistence through the repository adapter", () => {
    assert.match(workspace, /valme-demo-seo-audits-v1/);
    assert.match(workspace, /ValmeSeoAuditRepository\.create/);
    assert.doesNotMatch(workspace, /localStorage\.setItem/);
    assert.match(repository, /schemaVersion: SCHEMA_VERSION/);
    assert.match(repository, /storage\(\)\.setItem/);
    assert.doesNotMatch(workspace, /\bfetch\s*\(/);
    assert.doesNotMatch(workspace, /supabase/i);
    assert.doesNotMatch(workspace, /service_role|anon_key|bearer\s+[a-z0-9]/i);
  });

  it("uses reserved example domains in seeded records", () => {
    const seededDomains = [...workspace.matchAll(/domain:\s*["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
    assert.ok(seededDomains.length >= 3);
    assert.ok(seededDomains.every((domain) => domain.endsWith(".example")));
  });

  it("keeps validated and cancelled audits read-only", () => {
    assert.match(workspace, /\[["']validado["'],\s*["']cancelado["']\]\.includes\(a\.state\)/);
    assert.match(workspace, /Los artefactos quedan en modo consulta/);
    assert.doesNotMatch(
      workspace.match(/const SEO_AUDIT_ACTIONS = \{([\s\S]*?)\n\};/)?.[1] ?? "",
      /validado:|cancelado:/,
    );
  });
});
