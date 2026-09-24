import { defineTool } from "@lovable.dev/mcp-js";
import { DEMO_NOTICE, PRINCIPIO } from "../data";
import { explainAuditContract } from "../../seo-audit";

export default defineTool({
  name: "explain_seo_audit_contract",
  title: "Explicar contrato de auditoria SEO",
  description:
    "Explica el contrato nativo de auditoria SEO de VALME, sus limites de autorizacion y su separacion de la ejecucion de planes.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const contract = explainAuditContract();
    return {
      content: [
        {
          type: "text" as const,
          text:
            DEMO_NOTICE +
            "\n" +
            PRINCIPIO +
            "\n\nContrato: " +
            contract.versionedContract +
            "\n" +
            contract.authorizationBoundary +
            "\n" +
            contract.noSecrets +
            "\n\nNo ejecuta Python, no conecta proveedores y no expone prompts ni rutas internas del snapshot Claude SEO.",
        },
      ],
      structuredContent: {
        aviso: DEMO_NOTICE,
        executionEnabled: false,
        ...contract,
      },
    };
  },
});
