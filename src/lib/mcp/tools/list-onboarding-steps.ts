import { defineTool } from "@lovable.dev/mcp-js";
import { DEMO_NOTICE, ESTADOS_ACCESO, PASOS_ONBOARDING } from "../data";

export default defineTool({
  name: "list_onboarding_steps",
  title: "Listar pasos del alta de cliente",
  description:
    "Devuelve los ocho pasos (A–H) del alta guiada de cliente, indicando cuáles ve el equipo del cliente, y los estados posibles de un acceso. Datos de demostración.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text" as const,
        text:
          DEMO_NOTICE +
          "\n\nPasos del alta:\n" +
          PASOS_ONBOARDING.map(
            (p) =>
              `- ${p.letra}. ${p.titulo}${p.visibleParaCliente ? " (visible en la vista del cliente)" : " (solo interno)"}`,
          ).join("\n") +
          "\n\nEstados de acceso: " +
          ESTADOS_ACCESO.join(", ") +
          ".\nNunca se piden contraseñas ni claves; las validaciones son simuladas.",
      },
    ],
    structuredContent: {
      aviso: DEMO_NOTICE,
      pasos: PASOS_ONBOARDING.map((p) => ({
        letra: p.letra,
        titulo: p.titulo,
        visibleParaCliente: p.visibleParaCliente,
      })),
      estadosAcceso: ESTADOS_ACCESO.map((e) => e),
    },
  }),
});
