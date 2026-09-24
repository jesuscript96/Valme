import assert from "node:assert/strict";
import { describe, test } from "node:test";
import explainSeoAuditContractTool from "../mcp/tools/explain-seo-audit-contract";
import listSeoAuditStatesTool from "../mcp/tools/list-seo-audit-states";
import listSeoCapabilitiesTool from "../mcp/tools/list-seo-capabilities";
import {
  SEO_CAPABILITIES,
  SEO_AUDIT_VERSION,
  calculateCoverageByService,
  decideWorkCanStart,
  listSeoAuditStates,
  returnAuditFromQuality,
  seoAuditContractSchema,
  transitionAuditState,
  validateAuditFromQuality,
  type Evidence,
  type Finding,
  type SeoAuditContract,
} from ".";

const baseContract: SeoAuditContract = {
  auditId: "AUD-DEMO-001",
  tenantId: "TENANT-DEMO",
  clientId: "CLIENT-DEMO",
  projectId: "PROJECT-DEMO",
  serviceIds: ["SEO", "SEO técnico"],
  requestedBy: "pm-demo",
  authorizedBy: "pm-demo",
  authorizationRef: "AUTH-DEMO-001",
  primaryDomain: "example.test",
  seedUrls: ["https://example.test/"],
  markets: ["ES"],
  languages: ["es"],
  authorizedScope: {
    includedDomains: ["example.test"],
    includedPaths: ["/"],
    excludedPaths: ["/admin"],
    allowedReadActions: ["leer HTML aportado", "recoger evidencias autorizadas"],
    explicitlyExcludedActions: ["publicar", "modificar web", "enviar informes", "gasto adicional"],
  },
  requestedCapabilityIds: ["auditoria_completa", "seo_tecnico"],
  accessRefs: [],
  limits: { maxPages: 10, maxDurationMinutes: 30, maxCostAmount: 0, currency: "EUR" },
  createdAt: "2026-09-24T10:00:00.000Z",
  version: SEO_AUDIT_VERSION,
  state: "autorizado",
};

const evidence: Evidence = {
  evidenceId: "EV-DEMO-001",
  auditId: baseContract.auditId,
  urlOrResource: "https://example.test/",
  source: "fixture",
  observedAt: "2026-09-24T10:01:00.000Z",
  collectionMethod: "html_aportado",
  observedSnippetOrData: "title presente",
  containsExternalUntrustedData: true,
  device: "unknown",
  level: "url",
};

const finding: Finding = {
  findingId: "F-DEMO-001",
  auditId: baseContract.auditId,
  category: "seo_tecnico",
  relatedServiceId: "SEO técnico",
  title: "Title duplicado",
  description: "Dos paginas comparten el mismo title.",
  priority: "media",
  impact: "Riesgo de baja claridad en SERP.",
  recommendation: "Revisar titles por plantilla.",
  state: "propuesto",
  resultType: "observacion",
  confidence: "media",
  sources: ["fixture"],
  evidenceIds: [evidence.evidenceId],
  observedAt: "2026-09-24T10:01:00.000Z",
  responsible: { kind: "agent", id: "pod-seo-tecnico", name: "SEO tecnico" },
  limitations: [],
  requiresHumanApproval: true,
};

describe("seo audit contracts", () => {
  test("validates the native audit contract", () => {
    assert.equal(seoAuditContractSchema.parse(baseContract).auditId, "AUD-DEMO-001");
  });

  test("rejects authorized work without an authorization reference", () => {
    const result = seoAuditContractSchema.safeParse({
      ...baseContract,
      authorizationRef: undefined,
    });
    assert.equal(result.success, false);
  });
});

describe("seo audit state machine", () => {
  test("allows expected transitions and rejects invalid ones", () => {
    assert.equal(transitionAuditState("autorizado", "en_cola"), "en_cola");
    assert.throws(
      () => transitionAuditState("validado", "en_ejecucion"),
      /Transicion no permitida/,
    );
  });

  test("requires reauthorization to resume a returned audit", () => {
    assert.throws(() => transitionAuditState("devuelto", "en_ejecucion"), /Transicion no permitida/);
    assert.throws(() => transitionAuditState("devuelto", "en_cola"), /Transicion no permitida/);
    assert.throws(() => transitionAuditState("devuelto", "autorizado"), /Transicion no permitida/);
    assert.equal(transitionAuditState("devuelto", "pendiente_autorizacion"), "pendiente_autorizacion");
    assert.equal(transitionAuditState("pendiente_autorizacion", "autorizado"), "autorizado");
  });

  test("only authorized states lead to executable states", () => {
    const executable = ["en_cola", "en_ejecucion"];
    for (const state of listSeoAuditStates()) {
      if (["autorizado", "en_cola", "bloqueado"].includes(state.state)) continue;
      for (const next of state.allowedNextStates) {
        assert.equal(executable.includes(next), false, `${state.state} -> ${next}`);
      }
    }
  });

  test("lists all states with explicit next states", () => {
    assert.equal(
      listSeoAuditStates().some((state) => state.state === "control_calidad"),
      true,
    );
  });
});

describe("seo audit governance", () => {
  test("blocks start when required access is missing", () => {
    const contract = {
      ...baseContract,
      serviceIds: ["SEO"],
      requestedCapabilityIds: ["search_console"],
    };
    const decision = decideWorkCanStart(contract);
    assert.equal(decision.canStart, false);
    assert.equal(
      decision.issues.some((issue) => issue.code === "missing_access_reference"),
      true,
    );
  });

  test("calculates sufficient, partial and absent coverage", () => {
    const contract = { ...baseContract, serviceIds: ["SEO", "SEO técnico", "Contenidos"] };
    const partialFinding = {
      ...finding,
      findingId: "F-DEMO-002",
      relatedServiceId: "SEO",
      dependsOnAccessId: "gsc",
    };
    const coverage = calculateCoverageByService(contract, [finding, partialFinding], [evidence]);
    assert.equal(
      coverage.find((item) => item.serviceId === "SEO técnico")?.state,
      "evidencia_suficiente",
    );
    assert.equal(coverage.find((item) => item.serviceId === "SEO")?.state, "cobertura_parcial");
    assert.equal(
      coverage.find((item) => item.serviceId === "Contenidos")?.state,
      "pendiente_justificado",
    );
  });

  test("quality validation does not approve later plan execution", () => {
    const coverage = calculateCoverageByService(
      baseContract,
      [finding],
      [evidence],
      [
        {
          serviceId: "SEO",
          state: "ausencia_declarada",
          reason: "Sin datos GSC autorizados en esta entrega.",
          declaredBy: "pm-demo",
          declaredAt: "2026-09-24T10:02:00.000Z",
        },
      ],
    );
    assert.deepEqual(validateAuditFromQuality(coverage), {
      nextState: "validado",
      planExecutionApproved: false,
    });
  });

  test("returning an audit requires a reason", () => {
    assert.throws(() => returnAuditFromQuality(""), /motivo escrito/);
  });
});

describe("seo capability catalog", () => {
  test("keeps the first delivery in reference or designed state", () => {
    assert.equal(SEO_CAPABILITIES.length >= 19, true);
    assert.equal(
      SEO_CAPABILITIES.every((capability) =>
        ["referencia", "disenada"].includes(capability.integrationState),
      ),
      true,
    );
  });
});

describe("seo MCP tools", () => {
  test("expose read-only idempotent query tools", () => {
    for (const tool of [
      listSeoCapabilitiesTool,
      explainSeoAuditContractTool,
      listSeoAuditStatesTool,
    ]) {
      const exposed = tool as unknown as {
        name: string;
        annotations: { readOnlyHint: boolean; idempotentHint: boolean; openWorldHint: boolean };
      };
      assert.match(exposed.name, /seo/);
      assert.equal(exposed.annotations.readOnlyHint, true);
      assert.equal(exposed.annotations.idempotentHint, true);
      assert.equal(exposed.annotations.openWorldHint, false);
    }
  });
});
