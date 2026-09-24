import { defineTool } from "@lovable.dev/mcp-js";
import { DEMO_NOTICE, PRINCIPIO } from "../data";
import { listSeoAuditStates } from "../../seo-audit";

export default defineTool({
  name: "list_seo_audit_states",
  title: "Listar estados de auditoria SEO",
  description:
    "Devuelve la maquina de estados nativa de auditoria SEO y sus transiciones permitidas. Consulta sin efectos.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const states = listSeoAuditStates();
    return {
      content: [
        {
          type: "text" as const,
          text:
            DEMO_NOTICE +
            "\n" +
            PRINCIPIO +
            "\n\nEstados:\n" +
            states
              .map(
                (state) =>
                  `- ${state.state}: ${state.description} Siguientes: ${state.allowedNextStates.join(", ") || "ninguno"}.`,
              )
              .join("\n"),
        },
      ],
      structuredContent: {
        aviso: DEMO_NOTICE,
        principle: PRINCIPIO,
        executionEnabled: false,
        states,
      },
    };
  },
});
