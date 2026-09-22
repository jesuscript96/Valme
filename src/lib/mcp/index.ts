import { defineMcp } from "@lovable.dev/mcp-js";
import explainDiagnosticFlowTool from "./tools/explain-diagnostic-flow";
import listOnboardingStepsTool from "./tools/list-onboarding-steps";
import listServicesTool from "./tools/list-services";
import listSupervisionRulesTool from "./tools/list-supervision-rules";

export default defineMcp({
  name: "github-connector",
  title: "GitHub Connector",
  version: "0.1.0",
  instructions:
    "Herramientas de consulta de VALME Search OS, un sistema operativo de agencia SEO/AEO/GEO con supervisión de Project Manager. Todos los datos son ficticios y de demostración: no hay clientes reales ni mediciones reales. Usa `list_services` para el catálogo de servicios y especialidades, `list_onboarding_steps` para el alta guiada de cliente, `explain_diagnostic_flow` para los estados y comprobaciones del diagnóstico, y `list_supervision_rules` para las reglas del flujo supervisado.",
  tools: [
    listServicesTool,
    listOnboardingStepsTool,
    explainDiagnosticFlowTool,
    listSupervisionRulesTool,
  ],
});
