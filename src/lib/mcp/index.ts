import { auth, defineMcp } from "@lovable.dev/mcp-js";
import explainDiagnosticFlowTool from "./tools/explain-diagnostic-flow";
import explainSeoAuditContractTool from "./tools/explain-seo-audit-contract";
import listOnboardingStepsTool from "./tools/list-onboarding-steps";
import listSeoAuditStatesTool from "./tools/list-seo-audit-states";
import listSeoCapabilitiesTool from "./tools/list-seo-capabilities";
import listServicesTool from "./tools/list-services";
import listSupervisionRulesTool from "./tools/list-supervision-rules";

const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"] ?? "";

export default defineMcp({
  // El servidor exige inicio de sesión: solo tokens emitidos por la
  // autenticación del propio proyecto pueden llamar a las herramientas.
  auth: auth.oauth.issuer({
    issuer: `${SUPABASE_URL}/auth/v1`,
    acceptedAudiences: "authenticated",
    resourceName: "VALME Search OS",
  }),
  name: "github-connector",
  title: "GitHub Connector",
  version: "0.1.0",
  instructions:
    "Herramientas de consulta de VALME Search OS, un sistema operativo de agencia SEO/AEO/GEO con supervisión de Project Manager. Todos los datos son ficticios y de demostración: no hay clientes reales ni mediciones reales. Usa `list_services` para el catálogo de servicios y especialidades, `list_onboarding_steps` para el alta guiada de cliente, `explain_diagnostic_flow` para los estados y comprobaciones del diagnóstico, `list_supervision_rules` para las reglas del flujo supervisado, `list_seo_capabilities` para capacidades SEO/AEO/GEO diseñadas o conservadas como referencia, `explain_seo_audit_contract` para el contrato nativo de auditoría, y `list_seo_audit_states` para su máquina de estados.",
  tools: [
    listServicesTool,
    listOnboardingStepsTool,
    explainDiagnosticFlowTool,
    listSupervisionRulesTool,
    listSeoCapabilitiesTool,
    explainSeoAuditContractTool,
    listSeoAuditStatesTool,
  ],
});
