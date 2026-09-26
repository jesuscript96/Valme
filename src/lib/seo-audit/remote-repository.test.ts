import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import type { Database } from "@/integrations/supabase/types";
import {
  SeoAuditRemoteDisabledError,
  SeoAuditRepositoryError,
  assertSeoAuditRemoteEnabled,
  createSeoAuditDraftInputSchema,
  createSeoAuditServerRepository,
  type CreateSeoAuditDraftInput,
  type SeoAuditStore,
} from "./repository.server";

type AuditRow = Database["public"]["Tables"]["seo_audits"]["Row"];
type AuditInsert = Database["public"]["Tables"]["seo_audits"]["Insert"];
type AuditUpdate = Database["public"]["Tables"]["seo_audits"]["Update"];

const serverSource = readFileSync(new URL("./repository.server.ts", import.meta.url), "utf8");
const functionsSource = readFileSync(new URL("./repository.functions.ts", import.meta.url), "utf8");

function audit(overrides: Partial<AuditRow> = {}): AuditRow {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    tenant_id: "20000000-0000-4000-8000-000000000001",
    client_id: "30000000-0000-4000-8000-000000000001",
    project_id: "40000000-0000-4000-8000-000000000001",
    requested_by: "50000000-0000-4000-8000-000000000001",
    authorized_by: null,
    authorization_ref: null,
    service_ids: ["seo_tecnico"],
    primary_domain: "example.test",
    seed_urls: ["https://example.test/"],
    markets: ["ES"],
    languages: ["es"],
    authorized_scope: {},
    requested_capability_ids: ["crawling"],
    max_pages: 100,
    max_duration_minutes: 30,
    max_cost_amount: 0,
    currency: "EUR",
    contract_version: "2026-09-24.1",
    state: "borrador",
    transition_reason: null,
    created_at: "2026-09-25T00:00:00.000Z",
    updated_at: "2026-09-25T00:00:00.000Z",
    ...overrides,
  };
}

function draftInput(): CreateSeoAuditDraftInput {
  return {
    projectId: "40000000-0000-4000-8000-000000000001",
    serviceIds: ["seo_tecnico"],
    primaryDomain: "example.test",
    seedUrls: ["https://example.test/"],
    markets: ["ES"],
    languages: ["es"],
    authorizedScope: {
      includedDomains: ["example.test"],
      includedPaths: ["/"],
      excludedPaths: ["/privado"],
      allowedReadActions: ["fetch_public_html"],
      explicitlyExcludedActions: ["publish", "write"],
    },
    requestedCapabilityIds: ["crawling"],
    limits: { maxPages: 100, maxDurationMinutes: 30, maxCostAmount: 0, currency: "eur" },
  };
}

function fakeStore(initial: AuditRow = audit()) {
  const calls: {
    inserted?: AuditInsert;
    updated?: AuditUpdate;
    expectedState?: AuditRow["state"];
  } = {};
  let current: AuditRow | null = initial;
  const store: SeoAuditStore = {
    listAudits: async () => (current ? [current] : []),
    listClients: async () => [{ id: "30000000-0000-4000-8000-000000000001", nombre: "Cliente" }],
    listProjects: async () => [
      {
        id: "40000000-0000-4000-8000-000000000001",
        client_id: "30000000-0000-4000-8000-000000000001",
        nombre: "Proyecto",
        primary_domain: "project.example",
      },
    ],
    findProject: async (projectId) => ({
      id: projectId,
      tenant_id: "20000000-0000-4000-8000-000000000001",
      client_id: "30000000-0000-4000-8000-000000000001",
      primary_domain: "project.example",
    }),
    insertAudit: async (inserted) => {
      calls.inserted = inserted;
      current = audit({ ...inserted, id: initial.id });
      return current;
    },
    findAudit: async () => current,
    updateAudit: async (_auditId, expectedState, patch) => {
      calls.updated = patch;
      calls.expectedState = expectedState;
      current = current ? audit({ ...current, ...patch }) : null;
      return current;
    },
  };
  return { store, calls, setCurrent: (value: AuditRow | null) => (current = value) };
}

describe("SEO audit authenticated server repository", () => {
  it("fails closed unless the server-only flag is exactly true", () => {
    assert.throws(() => assertSeoAuditRemoteEnabled({}), SeoAuditRemoteDisabledError);
    assert.throws(
      () => assertSeoAuditRemoteEnabled({ SEO_AUDIT_REMOTE_ENABLED: "TRUE" }),
      SeoAuditRemoteDisabledError,
    );
    assert.throws(
      () =>
        assertSeoAuditRemoteEnabled({
          SEO_AUDIT_REMOTE_ENABLED: "true",
          SEO_AUDIT_REMOTE_ENVIRONMENT: "staging",
          SEO_AUDIT_REMOTE_PROJECT_REF: "staging-ref",
          SUPABASE_URL: "https://production-ref.supabase.co",
        }),
      SeoAuditRemoteDisabledError,
    );
    assert.doesNotThrow(() =>
      assertSeoAuditRemoteEnabled({
        SEO_AUDIT_REMOTE_ENABLED: "true",
        SEO_AUDIT_REMOTE_ENVIRONMENT: "staging",
        SEO_AUDIT_REMOTE_PROJECT_REF: "staging-ref",
        SUPABASE_URL: "https://staging-ref.supabase.co",
      }),
    );
  });

  it("rejects browser-owned tenant, client, requester and state fields", () => {
    assert.throws(() =>
      createSeoAuditDraftInputSchema.parse({
        ...draftInput(),
        tenantId: "20000000-0000-4000-8000-000000000001",
        clientId: "30000000-0000-4000-8000-000000000001",
        requestedBy: "spoofed",
        state: "autorizado",
      }),
    );
  });

  it("derives tenancy from the RLS-visible project and creates only a draft", async () => {
    const { store, calls } = fakeStore();
    const userId = "50000000-0000-4000-8000-000000000009";

    const created = await createSeoAuditServerRepository(store, userId).createDraft(draftInput());

    assert.equal(calls.inserted?.tenant_id, "20000000-0000-4000-8000-000000000001");
    assert.equal(calls.inserted?.client_id, "30000000-0000-4000-8000-000000000001");
    assert.equal(calls.inserted?.requested_by, userId);
    assert.equal(calls.inserted?.state, "borrador");
    assert.equal(calls.inserted?.currency, "EUR");
    assert.equal(calls.inserted?.authorized_by, undefined);
    assert.equal(created.state, "borrador");
  });

  it("loads only the RLS-visible workspace context", async () => {
    const { store } = fakeStore();
    const workspace = await createSeoAuditServerRepository(store, "user").workspace();

    assert.equal(workspace.audits.length, 1);
    assert.deepEqual(
      workspace.clients.map((client) => client.nombre),
      ["Cliente"],
    );
    assert.deepEqual(
      workspace.projects.map((project) => project.nombre),
      ["Proyecto"],
    );
  });

  it("does not reveal whether an inaccessible project exists", async () => {
    const { store } = fakeStore();
    store.findProject = async () => null;

    await assert.rejects(
      () => createSeoAuditServerRepository(store, "user").createDraft(draftInput()),
      (error: unknown) =>
        error instanceof SeoAuditRepositoryError && error.code === "project-not-visible",
    );
  });

  it("records authorization only for the authenticated user", async () => {
    const pending = audit({ state: "pendiente_autorizacion" });
    const { store, calls } = fakeStore(pending);
    const userId = "50000000-0000-4000-8000-000000000009";

    await createSeoAuditServerRepository(store, userId).transition({
      auditId: pending.id,
      nextState: "autorizado",
      authorizationRef: "PM-APPROVAL-42",
    });

    assert.equal(calls.expectedState, "pendiente_autorizacion");
    assert.equal(calls.updated?.authorized_by, userId);
    assert.equal(calls.updated?.authorization_ref, "PM-APPROVAL-42");
  });

  it("rejects invalid transitions and required transition metadata before writing", async () => {
    const draft = audit({ state: "borrador" });
    const { store, calls } = fakeStore(draft);
    const repository = createSeoAuditServerRepository(store, "user");

    await assert.rejects(() =>
      repository.transition({ auditId: draft.id, nextState: "en_ejecucion" }),
    );
    await assert.rejects(
      () => repository.transition({ auditId: draft.id, nextState: "cancelado" }),
      /requiere motivo/,
    );
    assert.equal(calls.updated, undefined);
  });

  it("detects a concurrent transition instead of overwriting it", async () => {
    const { store } = fakeStore();
    store.updateAudit = async () => null;

    await assert.rejects(
      () =>
        createSeoAuditServerRepository(store, "user").transition({
          auditId: audit().id,
          nextState: "cancelado",
          reason: "Cancelada por el PM",
        }),
      (error: unknown) =>
        error instanceof SeoAuditRepositoryError && error.code === "transition-conflict",
    );
  });

  it("propagates storage failures without falling back to local data", async () => {
    const { store } = fakeStore();
    store.listAudits = async () => {
      throw new Error("network unavailable");
    };
    await assert.rejects(
      () => createSeoAuditServerRepository(store, "user").list(),
      /network unavailable/,
    );
  });

  it("uses authenticated server functions and contains no admin client", () => {
    assert.match(functionsSource, /middleware\(\[requireSupabaseAuth\]\)/);
    assert.match(functionsSource, /assertSeoAuditRemoteEnabled\(\)/);
    assert.match(functionsSource, /loadSeoAuditWorkspace/);
    assert.doesNotMatch(
      serverSource + functionsSource,
      /client\.server|supabaseAdmin|service_role/i,
    );
    assert.doesNotMatch(functionsSource, /VITE_SEO_AUDIT_REMOTE_ENABLED/);
    assert.doesNotMatch(serverSource, /\$\{error\.message\}/);
  });
});
