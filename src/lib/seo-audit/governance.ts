import { SEO_CAPABILITIES, getSeoCapability } from "./capabilities";
import { seoAuditContractSchema } from "./schemas";
import { assertAllowedTransition } from "./states";
import {
  SeoAuditGovernanceError,
  type CoverageDeclaration,
  type Evidence,
  type Finding,
  type GovernanceIssue,
  type SeoAuditContract,
  type SeoAuditState,
  type ServiceCoverage,
} from "./types";

export function validateAuditContract(contract: SeoAuditContract): SeoAuditContract {
  const result = seoAuditContractSchema.safeParse(contract);
  if (result.success) return result.data;

  throw new SeoAuditGovernanceError(
    "invalid_audit_contract",
    "El encargo de auditoria SEO no cumple el contrato VALME.",
    result.error.issues.map((issue) => ({
      code: "invalid_contract_field",
      field: issue.path.join("."),
      message: issue.message,
    })),
  );
}

export function ensureCapabilityInScope(contract: SeoAuditContract, capabilityId: string): void {
  if (!contract.requestedCapabilityIds.includes(capabilityId)) {
    throw new SeoAuditGovernanceError(
      "capability_out_of_scope",
      "La capacidad no forma parte del alcance autorizado.",
      [
        {
          code: "capability_out_of_scope",
          field: "requestedCapabilityIds",
          message: `La capacidad ${capabilityId} no esta solicitada en el encargo ${contract.auditId}.`,
          details: { capabilityId, requestedCapabilityIds: contract.requestedCapabilityIds },
        },
      ],
    );
  }

  const capability = getSeoCapability(capabilityId);
  if (!capability) {
    throw new SeoAuditGovernanceError(
      "unknown_capability",
      "La capacidad SEO no existe en el catalogo VALME.",
      [
        {
          code: "unknown_capability",
          field: "capabilityId",
          message: `Capacidad desconocida: ${capabilityId}.`,
        },
      ],
    );
  }

  const serviceCovered = capability.relatedServiceIds.some((serviceId) =>
    contract.serviceIds.includes(serviceId),
  );
  if (!serviceCovered) {
    throw new SeoAuditGovernanceError(
      "capability_service_mismatch",
      "La capacidad no corresponde a ningun servicio contratado.",
      [
        {
          code: "capability_service_mismatch",
          field: "serviceIds",
          message: `La capacidad ${capabilityId} no cubre los servicios contratados del encargo.`,
          details: {
            relatedServiceIds: capability.relatedServiceIds,
            serviceIds: contract.serviceIds,
          },
        },
      ],
    );
  }
}

export function checkRequiredAccesses(
  contract: SeoAuditContract,
  capabilityId: string,
): GovernanceIssue[] {
  const capability = getSeoCapability(capabilityId);
  if (!capability) {
    return [{ code: "unknown_capability", message: `Capacidad desconocida: ${capabilityId}.` }];
  }

  return capability.requiredAccess.reduce<GovernanceIssue[]>((issues, accessKind) => {
    const refs = contract.accessRefs.filter(
      (ref) => ref.kind === accessKind || ref.requiredForCapabilityIds.includes(capabilityId),
    );
    if (!refs.length) {
      issues.push({
        code: "missing_access_reference",
        field: "accessRefs",
        message: `Falta una referencia de acceso para ${accessKind}.`,
        details: { capabilityId, accessKind },
      });
      return issues;
    }
    const validRef = refs.find((ref) => ref.state === "validado");
    if (validRef) return issues;
    issues.push({
      code: "access_not_validated",
      field: "accessRefs",
      message: `El acceso ${accessKind} no esta validado.`,
      details: {
        capabilityId,
        accessKind,
        states: refs.map((ref) => ({ id: ref.accessId, state: ref.state })),
      },
    });
    return issues;
  }, []);
}

export function decideWorkCanStart(contract: SeoAuditContract): {
  canStart: boolean;
  issues: GovernanceIssue[];
} {
  validateAuditContract(contract);
  const issues: GovernanceIssue[] = [];

  if (!["autorizado", "en_cola"].includes(contract.state)) {
    issues.push({
      code: "state_does_not_allow_start",
      field: "state",
      message: `El estado ${contract.state} no permite iniciar recogida de evidencias.`,
    });
  }
  if (!contract.authorizedBy || !contract.authorizationRef) {
    issues.push({
      code: "missing_authorization",
      field: "authorizationRef",
      message: "La recogida de evidencias requiere authorizedBy y authorizationRef.",
    });
  }
  if (contract.limits.maxPages <= 0 || contract.limits.maxDurationMinutes <= 0) {
    issues.push({
      code: "invalid_limits",
      field: "limits",
      message: "Los limites de paginas y tiempo deben ser positivos.",
    });
  }

  for (const capabilityId of contract.requestedCapabilityIds) {
    try {
      ensureCapabilityInScope(contract, capabilityId);
      issues.push(...checkRequiredAccesses(contract, capabilityId));
    } catch (error) {
      if (error instanceof SeoAuditGovernanceError) issues.push(...error.issues);
      else throw error;
    }
  }

  return { canStart: issues.length === 0, issues };
}

export function calculateCoverageByService(
  contract: SeoAuditContract,
  findings: Finding[],
  evidences: Evidence[],
  declarations: CoverageDeclaration[] = [],
): ServiceCoverage[] {
  const evidenceIds = new Set(
    evidences.filter((evidence) => evidence.auditId === contract.auditId).map((e) => e.evidenceId),
  );
  return contract.serviceIds.map((serviceId) => {
    const serviceFindings = findings.filter(
      (finding) => finding.auditId === contract.auditId && finding.relatedServiceId === serviceId,
    );
    const supportedFindings = serviceFindings.filter(
      (finding) =>
        finding.state !== "descartado" &&
        finding.evidenceIds.length > 0 &&
        finding.evidenceIds.every((evidenceId) => evidenceIds.has(evidenceId)),
    );
    const blockedFindings = serviceFindings.filter(
      (finding) => finding.state === "bloqueado" || finding.dependsOnAccessId,
    );
    const declaration = declarations.find((item) => item.serviceId === serviceId);
    const findingIds = supportedFindings.map((finding) => finding.findingId);
    const serviceEvidenceIds = [
      ...new Set(supportedFindings.flatMap((finding) => finding.evidenceIds)),
    ];

    if (supportedFindings.length > 0 && blockedFindings.length === 0) {
      return {
        serviceId,
        state: "evidencia_suficiente",
        findingIds,
        evidenceIds: serviceEvidenceIds,
      };
    }
    if (supportedFindings.length > 0) {
      return {
        serviceId,
        state: "cobertura_parcial",
        findingIds,
        evidenceIds: serviceEvidenceIds,
        reason:
          "Hay evidencia util, pero una parte del servicio depende de accesos o datos no disponibles.",
      };
    }
    if (blockedFindings.length > 0) {
      return {
        serviceId,
        state: "bloqueo_por_acceso",
        findingIds: [],
        evidenceIds: [],
        reason: "Los hallazgos del servicio dependen de accesos no validados.",
      };
    }
    if (declaration) {
      return {
        serviceId,
        state: declaration.state,
        findingIds: [],
        evidenceIds: [],
        reason: declaration.reason,
      };
    }
    return {
      serviceId,
      state: "pendiente_justificado",
      findingIds: [],
      evidenceIds: [],
      reason: "No hay evidencia ni declaracion suficiente para este servicio.",
    };
  });
}

export function assertCanEnterQuality(coverage: ServiceCoverage[]): void {
  const blocking = coverage.filter(
    (item) =>
      item.state === "bloqueo_por_acceso" ||
      (item.state === "pendiente_justificado" && !item.reason),
  );
  if (!blocking.length) return;
  throw new SeoAuditGovernanceError(
    "quality_blocked_by_coverage",
    "No se puede pasar a control de calidad sin evidencia o declaracion por servicio.",
    blocking.map((item) => ({
      code: "service_without_quality_cover",
      field: "coverage",
      message: `El servicio ${item.serviceId} no tiene cobertura suficiente.`,
      details: item,
    })),
  );
}

export function transitionAuditState(current: SeoAuditState, next: SeoAuditState): SeoAuditState {
  assertAllowedTransition(current, next);
  return next;
}

export function returnAuditFromQuality(reason: string): {
  nextState: SeoAuditState;
  reason: string;
} {
  if (!reason.trim()) {
    throw new SeoAuditGovernanceError(
      "missing_return_reason",
      "Devolver una auditoria exige un motivo escrito.",
      [
        {
          code: "missing_return_reason",
          field: "reason",
          message: "El motivo de devolucion no puede estar vacio.",
        },
      ],
    );
  }
  return { nextState: "devuelto", reason: reason.trim() };
}

export function validateAuditFromQuality(coverage: ServiceCoverage[]): {
  nextState: SeoAuditState;
  planExecutionApproved: false;
} {
  assertCanEnterQuality(coverage);
  return { nextState: "validado", planExecutionApproved: false };
}

export function explainAuditContract() {
  return {
    principle: "Los agentes ejecutan. El Project Manager dirige.",
    versionedContract: "SeoAuditContract",
    authorizationBoundary:
      "Autorizar una auditoria permite recoger evidencias dentro del alcance; no autoriza cambios web, publicaciones, comunicaciones, gasto adicional ni ejecucion de planes.",
    noSecrets:
      "El encargo referencia accesos por id y estado. No almacena credenciales, tokens, claves ni secretos.",
    stateMachine:
      "Usa estados explicitos de negocio; las transiciones invalidas devuelven errores estructurados.",
    capabilityCatalog: SEO_CAPABILITIES.map((capability) => ({
      id: capability.id,
      integrationState: capability.integrationState,
      mode: capability.mode,
      responsiblePod: capability.responsiblePod,
    })),
  };
}
