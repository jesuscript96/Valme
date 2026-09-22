import { defineTool } from "@lovable.dev/mcp-js";
import { DEMO_NOTICE, PRINCIPIO, REGLAS_FLUJO } from "../data";

export default defineTool({
  name: "list_supervision_rules",
  title: "Listar reglas de supervisión",
  description:
    "Devuelve las reglas del flujo supervisado: qué autoriza el Project Manager, qué bloquea un acceso sin validar y por qué aprobar no equivale a ejecutar. Datos de demostración.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text" as const,
        text:
          DEMO_NOTICE +
          "\n" +
          PRINCIPIO +
          "\n\nReglas:\n" +
          REGLAS_FLUJO.map((r) => `- ${r}`).join("\n"),
      },
    ],
    structuredContent: {
      aviso: DEMO_NOTICE,
      principio: PRINCIPIO,
      reglas: REGLAS_FLUJO.map((r) => r),
    },
  }),
});
