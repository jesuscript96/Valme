import { z } from "zod";
import {
  ACCESS_STATES,
  AGENT_PODS,
  CAPABILITY_MODES,
  CAPABILITY_TYPES,
  CONFIDENCE_LEVELS,
  COVERAGE_STATES,
  FINDING_CATEGORIES,
  FINDING_STATES,
  INTEGRATION_STATES,
  PRIORITIES,
  RESULT_TYPES,
  SEO_AUDIT_STATES,
  SEO_AUDIT_VERSION,
  type Evidence,
  type Finding,
  type SeoAuditContract,
  type SeoCapability,
} from "./types";

const nonEmptyString = z.string().trim().min(1);
const isoDateString = z.string().datetime({ offset: true });

export const auditLimitsSchema = z.object({
  maxPages: z.number().int().positive(),
  maxDurationMinutes: z.number().int().positive(),
  maxCostAmount: z.number().nonnegative(),
  currency: z.string().trim().min(3).max(3),
});

export const authorizedScopeSchema = z.object({
  includedDomains: z.array(nonEmptyString).min(1),
  includedPaths: z.array(nonEmptyString).min(1),
  excludedPaths: z.array(nonEmptyString),
  allowedReadActions: z.array(nonEmptyString).min(1),
  explicitlyExcludedActions: z.array(nonEmptyString).min(1),
});

export const auditAccessRefSchema = z.object({
  accessId: nonEmptyString,
  kind: nonEmptyString,
  requiredForCapabilityIds: z.array(nonEmptyString),
  state: z.enum(ACCESS_STATES),
});

export const seoAuditContractSchema = z
  .object({
    auditId: nonEmptyString,
    tenantId: nonEmptyString,
    clientId: nonEmptyString,
    projectId: nonEmptyString,
    serviceIds: z.array(nonEmptyString).min(1),
    requestedBy: nonEmptyString,
    authorizedBy: nonEmptyString.optional(),
    authorizationRef: nonEmptyString.optional(),
    primaryDomain: nonEmptyString,
    seedUrls: z.array(z.url()).min(1),
    markets: z.array(nonEmptyString).min(1),
    languages: z.array(nonEmptyString).min(1),
    authorizedScope: authorizedScopeSchema,
    requestedCapabilityIds: z.array(nonEmptyString).min(1),
    accessRefs: z.array(auditAccessRefSchema),
    limits: auditLimitsSchema,
    createdAt: isoDateString,
    version: nonEmptyString.default(SEO_AUDIT_VERSION),
    state: z.enum(SEO_AUDIT_STATES),
  })
  .superRefine((contract, ctx) => {
    const isAuthorizedState = !["borrador", "pendiente_autorizacion"].includes(contract.state);
    if (isAuthorizedState && (!contract.authorizedBy || !contract.authorizationRef)) {
      ctx.addIssue({
        code: "custom",
        path: ["authorizationRef"],
        message: "Una auditoria autorizada o posterior requiere authorizedBy y authorizationRef.",
      });
    }
    if (contract.accessRefs.some((ref) => ref.kind.toLowerCase().includes("secret"))) {
      ctx.addIssue({
        code: "custom",
        path: ["accessRefs"],
        message: "El encargo solo referencia accesos; no puede almacenar credenciales ni secretos.",
      });
    }
  }) satisfies z.ZodType<SeoAuditContract>;

export const evidenceSchema = z.object({
  evidenceId: nonEmptyString,
  auditId: nonEmptyString,
  urlOrResource: nonEmptyString,
  source: nonEmptyString,
  observedAt: isoDateString,
  collectionMethod: nonEmptyString,
  observedSnippetOrData: nonEmptyString,
  artifactRef: nonEmptyString.optional(),
  integrityHash: nonEmptyString.optional(),
  containsExternalUntrustedData: z.boolean(),
  measurementPeriod: z
    .object({
      from: isoDateString,
      to: isoDateString,
    })
    .optional(),
  device: z.enum(["mobile", "desktop", "both", "unknown"]).optional(),
  market: nonEmptyString.optional(),
  language: nonEmptyString.optional(),
  level: z.enum(["url", "origin"]).optional(),
}) satisfies z.ZodType<Evidence>;

export const findingSchema = z.object({
  findingId: nonEmptyString,
  auditId: nonEmptyString,
  category: z.enum(FINDING_CATEGORIES),
  relatedServiceId: nonEmptyString,
  title: nonEmptyString,
  description: nonEmptyString,
  priority: z.enum(PRIORITIES),
  impact: nonEmptyString,
  recommendation: nonEmptyString,
  state: z.enum(FINDING_STATES),
  resultType: z.enum(RESULT_TYPES),
  confidence: z.enum(CONFIDENCE_LEVELS),
  sources: z.array(nonEmptyString).min(1),
  evidenceIds: z.array(nonEmptyString),
  observedAt: isoDateString,
  responsible: z.object({
    kind: z.enum(["agent", "tool"]),
    id: nonEmptyString,
    name: nonEmptyString,
  }),
  dependsOnAccessId: nonEmptyString.optional(),
  limitations: z.array(nonEmptyString),
  requiresHumanApproval: z.boolean(),
}) satisfies z.ZodType<Finding>;

export const serviceCoverageSchema = z.object({
  serviceId: nonEmptyString,
  state: z.enum(COVERAGE_STATES),
  findingIds: z.array(nonEmptyString),
  evidenceIds: z.array(nonEmptyString),
  reason: nonEmptyString.optional(),
});

export const seoCapabilitySchema = z.object({
  id: nonEmptyString,
  name: nonEmptyString,
  description: nonEmptyString,
  responsiblePod: z.enum(AGENT_PODS),
  claudeSeoComponent: nonEmptyString,
  type: z.enum(CAPABILITY_TYPES),
  requiredData: z.array(nonEmptyString),
  requiredAccess: z.array(nonEmptyString),
  mode: z.enum(CAPABILITY_MODES),
  possibleAutomation: nonEmptyString,
  requiresHumanApproval: z.boolean(),
  dependencies: z.array(nonEmptyString),
  expectedOutput: nonEmptyString,
  integrationState: z.enum(INTEGRATION_STATES),
  risksAndLimitations: z.array(nonEmptyString),
  relatedServiceIds: z.array(nonEmptyString).min(1),
}) satisfies z.ZodType<SeoCapability>;
