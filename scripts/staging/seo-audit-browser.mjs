import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { browserConfig } from "./seo-audit-browser-config.mjs";

let phase = "configuration";
let browser;
let server;
try {
  const config = browserConfig();
  const require = createRequire(resolve(process.env.E2E_RUNTIME_DIR, "package.json"));
  const { chromium } = require("playwright");
  const base = "http://127.0.0.1:4179";
  const serverEnv = {
    ...process.env,
    SUPABASE_URL: config.url,
    VITE_SUPABASE_URL: config.url,
    SUPABASE_PUBLISHABLE_KEY: config.key,
    VITE_SUPABASE_PUBLISHABLE_KEY: config.key,
    SEO_AUDIT_REMOTE_ENABLED: "true",
    SEO_AUDIT_REMOTE_ENVIRONMENT: "staging",
    SEO_AUDIT_REMOTE_PROJECT_REF: config.ref,
  };
  delete serverEnv.STAGING_E2E_ACTORS;
  delete serverEnv.STAGING_DB_URL;
  phase = "start local application";
  server = spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4179", "--strictPort"],
    { env: serverEnv, stdio: "ignore" },
  );
  server.on("error", () => {});
  let ready = false;
  for (let i = 0; i < 90; i++) {
    if (server.exitCode !== null) throw new Error("Application exited");
    try {
      ready = (await fetch(`${base}/auth`, { signal: AbortSignal.timeout(2000) })).ok;
    } catch {}
    if (ready) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  assert.ok(ready);
  browser = await chromium.launch();
  const sessions = {};
  async function openWorkspace(page) {
    const frame = await (await page.locator("iframe").elementHandle()).contentFrame();
    await frame.waitForFunction(
      () =>
        typeof seoAuditRepository !== "undefined" &&
        seoAuditRepository.status().mode === "supabase",
    );
    await frame.locator('nav [data-go="Auditorías"]').click();
    return frame;
  }
  async function rpc(frame, action, payload) {
    return frame.evaluate(
      ({ action, payload }) =>
        new Promise((resolve, reject) => {
          const id = crypto.randomUUID();
          const timeout = setTimeout(() => {
            window.removeEventListener("message", listener);
            reject(new Error("Bridge timeout"));
          }, 15000);
          function listener(event) {
            if (
              event.source !== parent ||
              event.origin !== location.origin ||
              event.data?.channel !== "valme:seo-audit:v1" ||
              event.data?.kind !== "response" ||
              event.data.id !== id
            )
              return;
            clearTimeout(timeout);
            window.removeEventListener("message", listener);
            resolve(event.data);
          }
          window.addEventListener("message", listener);
          parent.postMessage(
            { channel: "valme:seo-audit:v1", kind: "request", id, action, payload },
            location.origin,
          );
        }),
      { action, payload },
    );
  }
  for (const name of ["a", "b", "member"]) {
    phase = `login ${name}`;
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await page.goto(`${base}/auth`);
    await page.getByLabel("Email", { exact: true }).fill(config.actors[name].email);
    await page.getByLabel("Contraseña", { exact: true }).fill(config.actors[name].password);
    await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
    await page.waitForURL(`${base}/panel`);
    const frame = await openWorkspace(page);
    const result = await rpc(frame, "load");
    assert.equal(result.ok, true);
    assert.ok(result.data.projects.some((p) => p.id === config.actors[name].projectId));
    const project = result.data.projects.find((p) => p.id === config.actors[name].projectId);
    const projectUrl = new URL(
      project.primary_domain.includes("://")
        ? project.primary_domain
        : `https://${project.primary_domain}`,
    );
    assert.ok(projectUrl.hostname.endsWith(".test"));
    const forbidden = name === "b" ? config.actors.a.projectId : config.actors.b.projectId;
    assert.ok(!result.data.projects.some((p) => p.id === forbidden));
    assert.ok(!result.data.audits.some((a) => a.project_id === forbidden));
    sessions[name] = { page, frame };
    console.log(`OK authenticated workspace ${name}`);
  }
  const created = {};
  for (const name of ["a", "b"]) {
    phase = `create and reload ${name}`;
    const session = sessions[name];
    const before = await rpc(session.frame, "load");
    const ids = new Set(before.data.audits.map((a) => a.id));
    await session.frame.locator("[data-seo-new]").click();
    await session.frame.locator('[name="projectId"]').selectOption(config.actors[name].projectId);
    await session.frame.getByRole("button", { name: "Guardar borrador" }).click();
    await session.frame.locator('[data-seo-transition="pendiente_autorizacion"]').waitFor();
    await session.page.reload();
    session.frame = await openWorkspace(session.page);
    const after = await rpc(session.frame, "load");
    const fresh = after.data.audits.filter((a) => !ids.has(a.id));
    assert.equal(fresh.length, 1);
    assert.equal(fresh[0].state, "borrador");
    assert.equal(fresh[0].project_id, config.actors[name].projectId);
    created[name] = fresh[0];
    console.log(`OK persisted UI draft ${name}`);
  }
  phase = "cross-tenant denied mutations";
  assert.notEqual(created.a.tenant_id, created.b.tenant_id);
  for (const [name, other] of [
    ["a", "b"],
    ["b", "a"],
  ]) {
    const result = await rpc(sessions[name].frame, "transition", {
      auditId: created[other].id,
      nextState: "pendiente_autorizacion",
    });
    assert.equal(result.ok, false);
    const visible = await rpc(sessions[other].frame, "load");
    assert.equal(visible.data.audits.find((a) => a.id === created[other].id).state, "borrador");
  }
  phase = "role authorization";
  assert.equal(
    (
      await rpc(sessions.a.frame, "transition", {
        auditId: created.a.id,
        nextState: "pendiente_autorizacion",
      })
    ).ok,
    true,
  );
  const memberData = await rpc(sessions.member.frame, "load");
  assert.equal(
    memberData.data.audits.find((a) => a.id === created.a.id).state,
    "pendiente_autorizacion",
  );
  assert.equal(
    (
      await rpc(sessions.member.frame, "transition", {
        auditId: created.a.id,
        nextState: "autorizado",
        authorizationRef: "PR17 synthetic acceptance",
      })
    ).ok,
    false,
  );
  const unchanged = await rpc(sessions.a.frame, "load");
  assert.equal(
    unchanged.data.audits.find((a) => a.id === created.a.id).state,
    "pendiente_autorizacion",
  );
  assert.equal(
    (
      await rpc(sessions.a.frame, "transition", {
        auditId: created.a.id,
        nextState: "autorizado",
        authorizationRef: "PR17 synthetic acceptance",
      })
    ).ok,
    true,
  );
  phase = "close synthetic audits";
  for (const name of ["a", "b"])
    assert.equal(
      (
        await rpc(sessions[name].frame, "transition", {
          auditId: created[name].id,
          nextState: "cancelado",
          reason: "PR17 synthetic acceptance completed",
        })
      ).ok,
      true,
    );
  console.log("OK cross-tenant denial, member denial, manager authorization and cancellation");
  console.log("BROWSER ACCEPTANCE PASSED; synthetic cancelled audits retained in staging");
} catch {
  console.error(
    `BROWSER ACCEPTANCE FAILED at ${phase}; no credentials or browser artifacts exported`,
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
}
