import { auditarDominio } from "./audit";
import {
  browserClick,
  browserExtract,
  browserNavigate,
  browserScreenshot,
  browserSnapshot,
  browserType,
} from "./browser";
import type { Tool } from "./types";

/**
 * Las herramientas de v0. El orden importa: es el que ve el modelo y forma parte del
 * prefijo que se cachea, así que no se reordena sin motivo.
 */
export const TOOLS_V0: Tool[] = [
  browserNavigate,
  browserSnapshot,
  browserClick,
  browserType,
  browserScreenshot,
  browserExtract,
  auditarDominio,
] as Tool[];

export const TOOL_NAMES = TOOLS_V0.map((t) => t.name);

/** Las herramientas permitidas en una ejecución. Lista vacía = todas. */
export function toolsFor(allowed: string[]): Tool[] {
  if (allowed.length === 0) return TOOLS_V0;
  const desconocidas = allowed.filter((n) => !TOOL_NAMES.includes(n));
  if (desconocidas.length) throw new Error(`Herramientas desconocidas: ${desconocidas.join(", ")}`);
  return TOOLS_V0.filter((t) => allowed.includes(t.name));
}
