import { defineTool } from "@lovable.dev/mcp-js";
import { DEMO_NOTICE, PRINCIPIO } from "../data";
import { listSeoCapabilities } from "../../seo-audit";

export default defineTool({
  name: "list_seo_capabilities",
  title: "Listar capacidades SEO/AEO/GEO",
  description:
    "Devuelve el catalogo nativo de capacidades SEO/AEO/GEO de VALME y su relacion con Claude SEO. Consulta sin ejecucion externa.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const capabilities = listSeoCapabilities();
    return {
      content: [
        {
          type: "text" as const,
          text:
            DEMO_NOTICE +
            "\n" +
            PRINCIPIO +
            "\n\nCapacidades:\n" +
            capabilities
              .map(
                (capability) =>
                  `- ${capability.id}: ${capability.name} · ${capability.responsiblePod} · ${capability.integrationState}. ${capability.integrationState === "referencia" ? "Conservada como referencia; no ejecutable." : "Disenada; no disponible para ejecucion real."}`,
              )
              .join("\n"),
        },
      ],
      structuredContent: {
        aviso: DEMO_NOTICE,
        principio: PRINCIPIO,
        executionEnabled: false,
        capabilities,
      },
    };
  },
});
