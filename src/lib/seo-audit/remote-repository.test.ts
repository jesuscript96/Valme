import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import type { Database } from "@/integrations/supabase/seo-audit-staging.types";
import {
  SeoAuditRemoteDisabledError,
  SeoAuditRepositoryError,
  assertSeoAuditRemoteEnabled,
  createSeoAuditDraftInputSchema,
  createSeoAuditServerRepository,
  type CreateSeoAuditDraftInput,
  type ActionSummary,
  type EvidenceSummary,
  type FindingEvidenceLink,
  type FindingSummary,
  importSeoAuditReviewInputSchema,
  createFindingActionInputSchema,
  type SeoAuditStore,
} from "./repository.server";
import {
  SEO_AUDIT_GENERIC_ERROR,
  SEO_AUDIT_PUBLIC_ERRORS,
  publicSeoAuditErrorMessage,
} from "./public-errors";

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
    archived_at: null,
    archived_by: null,
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

const CLIENT_ID = "30000000-0000-4000-8000-000000000001";
const TENANT_ID = "20000000-0000-4000-8000-000000000001";

type ClientState = {
  id: string;
  nombre: string;
  sector: string;
  tenant_id: string;
  archived_at: string | null;
};

function fakeStore(initial: AuditRow = audit()) {
  const calls: {
    inserted?: AuditInsert;
    updated?: AuditUpdate;
    expectedState?: AuditRow["state"];
    clientInserted?: Record<string, unknown>;
    projectInserted?: Record<string, unknown>;
    clientArchive?: { archived_at: string | null; archived_by: string | null };
    auditArchive?: { archived_at: string | null; archived_by: string | null };
    findingsInserted?: Array<Record<string, unknown>>;
    review?: { review_decision: string; review_note: string | null };
    actionInserted?: Record<string, unknown>;
    actionUpdated?: Record<string, unknown>;
  } = {};
  const actions: ActionSummary[] = [];
  let current: AuditRow | null = initial;
  const findings: FindingSummary[] = [];
  const evidence: EvidenceSummary[] = [];
  const links: FindingEvidenceLink[] = [];
  const clients: ClientState[] = [
    {
      id: CLIENT_ID,
      nombre: "Cliente",
      sector: "General",
      tenant_id: TENANT_ID,
      archived_at: null,
    },
  ];
  const access = {
    value: { role: "super_admin", status: "activo", full_portfolio: false } as {
      role: "super_admin" | "project_manager" | "equipo" | "cliente";
      status: "activo" | "invitado" | "desactivado";
      full_portfolio: boolean;
    } | null,
  };
  const tenants = {
    value: [{ id: TENANT_ID, nombre: "VALME", role: "owner" as const }] as Array<{
      id: string;
      nombre: string;
      role: "owner" | "manager" | "member" | "reviewer" | null;
    }>,
  };
  const store: SeoAuditStore = {
    listAudits: async () => (current ? [current] : []),
    listClients: async () => clients.map((client) => ({ ...client })),
    listTenants: async () => tenants.value,
    findOwnAccess: async () => access.value,
    findClient: async (clientId) => {
      const client = clients.find((item) => item.id === clientId);
      return client ? { ...client } : null;
    },
    insertClient: async (client) => {
      calls.clientInserted = client as Record<string, unknown>;
      clients.push({
        id: String(client.id),
        nombre: client.nombre,
        sector: client.sector ?? "General",
        tenant_id: client.tenant_id,
        archived_at: null,
      });
    },
    insertProject: async (project) => {
      calls.projectInserted = project as Record<string, unknown>;
      return {
        id: "40000000-0000-4000-8000-000000000099",
        client_id: project.client_id,
        nombre: project.nombre,
        primary_domain: project.primary_domain,
      };
    },
    updateClientArchive: async (clientId, patch) => {
      calls.clientArchive = patch;
      const client = clients.find((item) => item.id === clientId);
      if (!client) return null;
      client.archived_at = patch.archived_at;
      return { ...client };
    },
    updateAuditArchive: async (_auditId, patch) => {
      calls.auditArchive = patch;
      current = current ? audit({ ...current, ...patch }) : null;
      return current;
    },
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
    listFindings: async () => findings.map((item) => ({ ...item })),
    listEvidence: async () => evidence.map((item) => ({ ...item })),
    listFindingEvidence: async () => links.map((item) => ({ ...item })),
    listPeople: async () => [{ user_id: "u-1", email: "pm@valme.test", full_name: "PM" }],
    findFinding: async (findingId) => findings.find((item) => item.id === findingId) ?? null,
    insertEvidence: async (rows) =>
      rows
        .map((row, index) => {
          const created = {
            id: `e0000000-0000-4000-8000-00000000000${evidence.length + index}`,
            audit_id: row.audit_id,
            url_or_resource: row.url_or_resource,
            source: row.source,
            observed_at: row.observed_at,
            collection_method: row.collection_method,
            observed_data: row.observed_data,
            contains_external_untrusted_data: row.contains_external_untrusted_data ?? true,
          };
          return created;
        })
        .map((created) => {
          evidence.push(created);
          return { id: created.id, url_or_resource: created.url_or_resource };
        }),
    insertFindings: async (rows) => {
      calls.findingsInserted = [...(calls.findingsInserted ?? []), ...rows];
      return rows.map((row, index) => {
        const created = {
          id: `f0000000-0000-4000-8000-00000000000${findings.length + index}`,
          audit_id: row.audit_id,
          category: row.category,
          related_service_id: row.related_service_id,
          title: row.title,
          description: row.description,
          priority: row.priority,
          impact: row.impact,
          recommendation: row.recommendation,
          state: "propuesto" as const,
          confidence: row.confidence,
          sources: row.sources,
          observed_at: row.observed_at,
          responsible_name: row.responsible_name,
          limitations: row.limitations ?? [],
          review_decision: "pendiente",
          review_note: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: "2026-09-28T00:00:00.000Z",
        };
        findings.push(created);
        return { id: created.id, title: created.title };
      });
    },
    linkFindingEvidence: async (rows) => {
      for (const row of rows) {
        links.push({
          audit_id: row.audit_id,
          finding_id: row.finding_id,
          evidence_id: row.evidence_id,
        });
      }
    },
    listActions: async () => actions.map((item) => ({ ...item })),
    listAgents: async () => [
      {
        id: "a0000000-0000-4000-8000-000000000001",
        nombre: "Agente Contenido",
        especialidad: "Contenido",
        disponibilidad: "disponible",
      },
    ],
    findAction: async (actionId) => actions.find((item) => item.id === actionId) ?? null,
    insertAction: async (row) => {
      calls.actionInserted = row as Record<string, unknown>;
      const created: ActionSummary = {
        id: `b0000000-0000-4000-8000-00000000000${actions.length}`,
        tenant_id: row.tenant_id,
        audit_id: row.audit_id,
        finding_id: row.finding_id,
        kind: row.kind,
        title: row.title,
        detail: row.detail,
        done_criteria: row.done_criteria ?? null,
        owner_user_id: row.owner_user_id,
        agent_id: row.agent_id ?? null,
        due_date: row.due_date ?? null,
        status: "pendiente",
        conclusion: null,
        outcome: null,
        created_by: row.created_by,
        created_at: "2026-09-28T00:00:00.000Z",
        updated_at: "2026-09-28T00:00:00.000Z",
        completed_by: null,
        completed_at: null,
      };
      actions.push(created);
      return { ...created };
    },
    updateAction: async (actionId, patch) => {
      calls.actionUpdated = patch as Record<string, unknown>;
      const action = actions.find((item) => item.id === actionId);
      if (!action) return null;
      Object.assign(action, patch);
      return { ...action };
    },
    updateFindingReview: async (findingId, patch) => {
      calls.review = patch;
      const finding = findings.find((item) => item.id === findingId);
      if (!finding) return null;
      Object.assign(finding, patch, { reviewed_by: "u-1", reviewed_at: "2026-09-28T10:00:00Z" });
      return { ...finding };
    },
  };
  return {
    store,
    calls,
    clients,
    access,
    tenants,
    findings,
    evidence,
    links,
    actions,
    setCurrent: (value: AuditRow | null) => (current = value),
  };
}

function reviewInput(auditId = audit().id) {
  return {
    auditId,
    reviewer: { id: "codex-revision-externa", name: "Revisión externa (Codex)" },
    evidence: [
      {
        key: "/",
        url: "https://www.example.test/",
        source: "Revisión externa (Codex)",
        collectionMethod: "HTTP",
        observedAt: "2026-09-27T21:23:21.334Z",
        observedData: "HTTP 200 · Título: Inicio",
      },
    ],
    findings: [
      {
        title: "Aclarar la oferta",
        description: "El H1 usa un eslogan.",
        impact: "Claridad de la oferta. Sin medición todavía.",
        recommendation: "Probar un encabezado descriptivo.",
        category: "contenido" as const,
        serviceId: "Contenidos",
        priority: "alta" as const,
        confidence: "media" as const,
        resultType: "observacion" as const,
        sources: ["https://www.example.test/"],
        evidenceKeys: ["/"],
        limitations: ["Revisión HTTP sin renderizado."],
      },
    ],
  };
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
    assert.deepEqual(
      workspace.tenants.map((tenant) => tenant.role),
      ["owner"],
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

  it("registers a client with its first project only for users who will see it", async () => {
    const { store, calls, access } = fakeStore();
    const userId = "50000000-0000-4000-8000-000000000009";
    const repository = createSeoAuditServerRepository(store, userId);

    const created = await repository.createClient({
      nombre: "VALME Solutions",
      projectName: "Web principal",
      primaryDomain: "https://www.ValmeSolutions.com/servicios",
    });
    assert.equal(created.client.nombre, "VALME Solutions");
    assert.equal(calls.clientInserted?.["tenant_id"], TENANT_ID);
    assert.equal(calls.clientInserted?.["archived_at"], undefined);
    assert.equal(calls.projectInserted?.["primary_domain"], "www.valmesolutions.com");
    assert.equal(calls.projectInserted?.["created_by"], userId);
    assert.equal(calls.projectInserted?.["client_id"], created.client.id);

    await assert.rejects(
      () =>
        repository.createClient({
          nombre: "valme solutions",
          projectName: "Web",
          primaryDomain: "valmesolutions.com",
        }),
      /Ya existe un cliente/,
    );

    access.value = { role: "project_manager", status: "activo", full_portfolio: false };
    await assert.rejects(
      () =>
        repository.createClient({ nombre: "Otro", projectName: "Web", primaryDomain: "otro.com" }),
      (error: unknown) => error instanceof SeoAuditRepositoryError && error.code === "not-allowed",
    );
  });

  it("rejects malformed domains and ambiguous organizations before writing", async () => {
    const { store, calls, tenants } = fakeStore();
    const repository = createSeoAuditServerRepository(store, "user");
    await assert.rejects(
      () =>
        repository.createClient({
          nombre: "X",
          projectName: "Web",
          primaryDomain: "no es un dominio",
        }),
      /dominio no es válido/,
    );
    tenants.value = [
      { id: TENANT_ID, nombre: "A", role: "manager" },
      { id: "20000000-0000-4000-8000-000000000002", nombre: "B", role: "owner" },
    ];
    await assert.rejects(
      () => repository.createClient({ nombre: "X", projectName: "Web", primaryDomain: "x.com" }),
      /Elige la organización/,
    );
    tenants.value = [{ id: TENANT_ID, nombre: "A", role: "member" }];
    await assert.rejects(
      () => repository.createClient({ nombre: "X", projectName: "Web", primaryDomain: "x.com" }),
      /Elige la organización/,
    );
    assert.equal(calls.clientInserted, undefined);
  });

  it("archives and restores clients and audits in the caller's own name", async () => {
    const { store, calls } = fakeStore();
    const userId = "50000000-0000-4000-8000-000000000009";
    const repository = createSeoAuditServerRepository(store, userId);

    const archivedClient = await repository.setClientArchived({
      clientId: CLIENT_ID,
      archived: true,
    });
    assert.ok(archivedClient.archived_at);
    assert.equal(calls.clientArchive?.archived_by, userId);
    await repository.setClientArchived({ clientId: CLIENT_ID, archived: false });
    assert.deepEqual(calls.clientArchive, { archived_at: null, archived_by: null });

    await repository.setAuditArchived({ auditId: audit().id, archived: true });
    assert.equal(calls.auditArchive?.archived_by, userId);
  });

  it("treats a filtered archive update as a permission error, not a silent success", async () => {
    const { store } = fakeStore();
    store.updateClientArchive = async () => null;
    store.updateAuditArchive = async () => null;
    const repository = createSeoAuditServerRepository(store, "member");
    await assert.rejects(
      () => repository.setClientArchived({ clientId: CLIENT_ID, archived: true }),
      /Solo un manager/,
    );
    await assert.rejects(
      () => repository.setAuditArchived({ auditId: audit().id, archived: true }),
      /Solo un manager/,
    );
  });

  it("keeps archived work read-only and blocks new work on archived clients", async () => {
    const { store, calls, clients } = fakeStore(
      audit({ archived_at: "2026-09-28T10:00:00Z", archived_by: "u" }),
    );
    const repository = createSeoAuditServerRepository(store, "user");
    await assert.rejects(
      () => repository.transition({ auditId: audit().id, nextState: "pendiente_autorizacion" }),
      /archivada/,
    );

    clients[0]!.archived_at = "2026-09-28T10:00:00Z";
    await assert.rejects(() => repository.createDraft(draftInput()), /cliente está archivado/);
    assert.equal(calls.inserted, undefined);
    assert.equal(calls.updated, undefined);
  });

  it("imports an external review once, linking each finding to its evidence", async () => {
    const { store, calls, findings, evidence, links } = fakeStore();
    const userId = "50000000-0000-4000-8000-000000000009";
    const repository = createSeoAuditServerRepository(store, userId);
    const input = importSeoAuditReviewInputSchema.parse(reviewInput());

    const first = await repository.importReview(input);
    assert.deepEqual(first, { evidence: 1, findings: 1, links: 1, skippedFindings: 0 });
    assert.equal(calls.findingsInserted?.[0]?.["responsible_kind"], "tool");
    assert.equal(calls.findingsInserted?.[0]?.["responsible_name"], "Revisión externa (Codex)");
    assert.equal(calls.findingsInserted?.[0]?.["created_by"], userId);
    assert.equal(calls.findingsInserted?.[0]?.["review_decision"], undefined);
    assert.equal(links[0]?.finding_id, findings[0]?.id);
    assert.equal(links[0]?.evidence_id, evidence[0]?.id);

    const again = await repository.importReview(input);
    assert.deepEqual(again, { evidence: 0, findings: 0, links: 0, skippedFindings: 1 });
    assert.equal(findings.length, 1);
    assert.equal(evidence.length, 1);
  });

  it("refuses incoherent or locked imports before writing", async () => {
    const { store, calls, setCurrent } = fakeStore();
    const repository = createSeoAuditServerRepository(store, "user");
    const broken = reviewInput();
    broken.findings[0]!.evidenceKeys = ["/no-existe"];
    await assert.rejects(() => repository.importReview(broken), /no es coherente/);

    setCurrent(audit({ state: "validado" }));
    await assert.rejects(() => repository.importReview(reviewInput()), /no admite cambios/);
    setCurrent(audit({ archived_at: "2026-09-28T10:00:00Z", archived_by: "u" }));
    await assert.rejects(() => repository.importReview(reviewInput()), /no admite cambios/);
    assert.equal(calls.findingsInserted, undefined);
    assert.throws(() => importSeoAuditReviewInputSchema.parse({ ...reviewInput(), findings: [] }));
  });

  it("records the PM decision on a finding and reports locked audits", async () => {
    const { store, calls, findings } = fakeStore();
    const repository = createSeoAuditServerRepository(store, "user");
    await repository.importReview(importSeoAuditReviewInputSchema.parse(reviewInput()));

    const reviewed = await repository.reviewFinding({
      findingId: findings[0]!.id,
      decision: "priorizar",
      note: "  Primero en septiembre  ",
    });
    assert.deepEqual(calls.review, {
      review_decision: "priorizar",
      review_note: "Primero en septiembre",
    });
    assert.equal(reviewed.review_decision, "priorizar");

    store.updateFindingReview = async () => null;
    await assert.rejects(
      () => repository.reviewFinding({ findingId: findings[0]!.id, decision: "investigar" }),
      /no admite cambios/,
    );
    await assert.rejects(
      () =>
        repository.reviewFinding({
          findingId: "f0000000-0000-4000-8000-0000000000ff",
          decision: "descartar",
        }),
      /hallazgo no existe/,
    );
  });

  it("requires a reason to discard a finding", async () => {
    const { store, findings, calls } = fakeStore();
    const repository = createSeoAuditServerRepository(store, "user");
    await repository.importReview(importSeoAuditReviewInputSchema.parse(reviewInput()));
    await assert.rejects(
      () =>
        repository.reviewFinding({ findingId: findings[0]!.id, decision: "descartar", note: "  " }),
      /escribe el motivo/,
    );
    assert.equal(calls.review, undefined);
  });

  it("creates follow-up tasks with a PM owner and an agent on the finding's audit", async () => {
    const { store, findings, calls } = fakeStore();
    const userId = "50000000-0000-4000-8000-000000000009";
    const repository = createSeoAuditServerRepository(store, userId);
    await repository.importReview(importSeoAuditReviewInputSchema.parse(reviewInput()));
    const input = createFindingActionInputSchema.parse({
      findingId: findings[0]!.id,
      kind: "investigacion",
      title: "Investigar demanda",
      detail: "¿Se busca «departamento de marketing externo»?",
      ownerUserId: "60000000-0000-4000-8000-000000000001",
      agentId: "a0000000-0000-4000-8000-000000000001",
      dueDate: "2026-10-05",
    });
    const action = await repository.createAction(input);
    assert.equal(action.status, "pendiente");
    assert.equal(calls.actionInserted?.["tenant_id"], TENANT_ID);
    assert.equal(calls.actionInserted?.["audit_id"], audit().id);
    assert.equal(calls.actionInserted?.["created_by"], userId);
    assert.equal(calls.actionInserted?.["due_date"], "2026-10-05");
    assert.throws(() => createFindingActionInputSchema.parse({ ...input, dueDate: "5/10/2026" }));
  });

  it("closes an investigation with a conclusion and applies its outcome to the finding", async () => {
    const { store, findings, calls } = fakeStore();
    const repository = createSeoAuditServerRepository(store, "user");
    await repository.importReview(importSeoAuditReviewInputSchema.parse(reviewInput()));
    const action = await repository.createAction(
      createFindingActionInputSchema.parse({
        findingId: findings[0]!.id,
        kind: "investigacion",
        title: "Investigar demanda",
        detail: "¿Hay demanda?",
        ownerUserId: "60000000-0000-4000-8000-000000000001",
      }),
    );

    await assert.rejects(
      () => repository.updateAction({ actionId: action.id, status: "hecha" }),
      /escribe su conclusión/,
    );
    const closed = await repository.updateAction({
      actionId: action.id,
      status: "hecha",
      conclusion: "Hay demanda en España",
      outcome: "priorizar",
    });
    assert.equal(closed.status, "hecha");
    assert.equal(closed.outcome, "priorizar");
    assert.deepEqual(calls.review, {
      review_decision: "priorizar",
      review_note: "Hay demanda en España",
    });
    await assert.rejects(
      () => repository.updateAction({ actionId: action.id, status: "en_curso" }),
      /está cerrada/,
    );
  });

  it("forwards only curated error messages to the browser", () => {
    assert.equal(
      publicSeoAuditErrorMessage(new Error(SEO_AUDIT_PUBLIC_ERRORS.archiveNotAllowed)),
      SEO_AUDIT_PUBLIC_ERRORS.archiveNotAllowed,
    );
    assert.equal(
      publicSeoAuditErrorMessage(new Error('duplicate key value violates unique constraint "x"')),
      SEO_AUDIT_GENERIC_ERROR,
    );
    assert.equal(publicSeoAuditErrorMessage("texto"), SEO_AUDIT_GENERIC_ERROR);
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
