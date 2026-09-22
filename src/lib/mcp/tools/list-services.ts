import { defineTool } from "@lovable.dev/mcp-js";
import { DEMO_NOTICE, ESPECIALIDADES, SERVICIOS } from "../data";

export default defineTool({
  name: "list_services",
  title: "Listar servicios y especialidades",
  description:
    "Devuelve el catálogo de servicios (SEO, SEO técnico, AEO, GEO, Contenidos) y las especialidades de agente de VALME Search OS. Datos de demostración.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text" as const,
        text:
          DEMO_NOTICE +
          "\n\nServicios:\n" +
          SERVICIOS.map((s) => `- ${s.nombre}: ${s.descripcion}`).join("\n") +
          "\n\nEspecialidades de agente:\n" +
          ESPECIALIDADES.map((e) => `- ${e}`).join("\n"),
      },
    ],
    structuredContent: {
      aviso: DEMO_NOTICE,
      servicios: SERVICIOS.map((s) => ({ id: s.id, nombre: s.nombre, descripcion: s.descripcion })),
      especialidades: ESPECIALIDADES.map((e) => e),
    },
  }),
});
