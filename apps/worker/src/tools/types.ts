import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { BrowserSession } from "./browser";

/**
 * CONTRATO DE UNA HERRAMIENTA.
 *
 * Una entrada (esquema Zod), una salida (bloques de contenido para el modelo) y nada
 * más. Es lo que dice el roadmap: «todo es una herramienta, no una pantalla». El mismo
 * contrato sirve para que mañana la web llame a la herramienta con un botón.
 *
 * La entrada se valida aquí, no en la API: el bucle no usa `strict`, así que un
 * argumento mal formado llega tal cual y vuelve al modelo como error para que corrija.
 */

export type ToolContext = {
  runId: string;
  clientId: string;
  /** Sesión de navegador de esta ejecución. Se abre la primera vez que se usa. */
  browser: () => Promise<BrowserSession>;
  /** Guarda el informe de una auditoría y devuelve su id. */
  saveAudit: (a: AuditToSave) => Promise<string>;
  signal: AbortSignal;
};

export type AuditToSave = {
  dominio: string;
  herramientas: string[];
  duracionMs: number;
  senales: number;
  resumen: unknown;
  hallazgos: unknown;
  fuentesNoDisponibles: unknown;
};

/** Lo que devuelve una herramienta: texto, imágenes, o las dos cosas. */
export type ToolOutput = string | Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam>;

export type Tool<S extends z.ZodType = z.ZodType> = {
  name: string;
  description: string;
  input: S;
  run: (input: z.infer<S>, ctx: ToolContext) => Promise<ToolOutput>;
};

export function defineTool<S extends z.ZodType>(t: Tool<S>): Tool<S> {
  return t;
}

/** La definición que se manda a la API, a partir del esquema Zod. */
export function toApiTool(t: Tool): Anthropic.Tool {
  const schema = z.toJSONSchema(t.input, { target: "draft-2020-12" }) as Record<string, unknown>;
  delete schema.$schema;
  return {
    name: t.name,
    description: t.description,
    input_schema: schema as Anthropic.Tool.InputSchema,
  };
}

/** Recorta un texto largo para no llenar el contexto con una sola página. */
export function recortar(texto: string, max = 30_000): string {
  if (texto.length <= max) return texto;
  return `${texto.slice(0, max)}\n\n[… recortado: ${texto.length - max} caracteres más]`;
}
