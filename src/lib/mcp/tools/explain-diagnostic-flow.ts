import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  DEMO_NOTICE,
  ESTADOS_DIAGNOSTICO,
  HALLAZGOS_TIPO,
  PASOS_CALIDAD,
  PRINCIPIO,
} from "../data";

export default defineTool({
  name: "explain_diagnostic_flow",
  title: "Explicar el recorrido de diagnóstico",
  description:
    "Explica los estados del encargo de diagnóstico, las comprobaciones de control de calidad y los tipos de hallazgo con sus dependencias de acceso. Datos de demostración.",
  inputSchema: {
    estado: z
      .enum(["Pendiente", "En curso", "Bloqueado", "En revisión", "Completado"])
      .optional()
      .describe("Limitar la explicación a un solo estado del encargo."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ estado }) => {
    const estados = estado
      ? ESTADOS_DIAGNOSTICO.filter((e) => e.estado === estado)
      : ESTADOS_DIAGNOSTICO;
    return {
      content: [
        {
          type: "text" as const,
          text:
            DEMO_NOTICE +
            "\n" +
            PRINCIPIO +
            "\n\nEstados del encargo:\n" +
            estados.map((e) => `- ${e.estado}: ${e.significado}`).join("\n") +
            "\n\nComprobaciones de control de calidad:\n" +
            PASOS_CALIDAD.map((p) => `- ${p}`).join("\n") +
            "\n\nTipos de hallazgo:\n" +
            HALLAZGOS_TIPO.map(
              (h) =>
                `- ${h.titulo} · servicio ${h.servicio} · prioridad ${h.prioridad} · ${h.dependeDe ? "depende de " + h.dependeDe : "sin dependencia de acceso"}`,
            ).join("\n"),
        },
      ],
      structuredContent: {
        aviso: DEMO_NOTICE,
        principio: PRINCIPIO,
        estados: estados.map((e) => ({ estado: e.estado, significado: e.significado })),
        comprobacionesCalidad: PASOS_CALIDAD.map((p) => p),
        hallazgos: HALLAZGOS_TIPO.map((h) => ({
          id: h.id,
          titulo: h.titulo,
          servicio: h.servicio,
          dependeDe: h.dependeDe,
          prioridad: h.prioridad,
        })),
      },
    };
  },
});
