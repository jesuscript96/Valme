"use server";

import { requireMember } from "@/os/auth/dal";
import { isConfigured, missingEnv } from "@/os/providers/config";
import { extractBrandKit } from "@/os/domain/brandKit";

export type WizardState =
  | { phase: "idle" }
  | { phase: "blocked"; missing: string[] }
  | { phase: "error"; message: string }
  | {
      phase: "done";
      identity: unknown;
      voice: unknown;
      business: unknown;
      personas: unknown;
      pagesRead: string[];
      costUsd: number;
    };

/**
 * Lanza la extracción. En producción esto encola un job de Trigger.dev y la pantalla se
 * suscribe al estado; aquí corre en línea porque sin cola no hay a quién suscribirse.
 *
 * Si faltan credenciales lo dice y para. No simula un resultado: un Brand Kit inventado
 * es peor que no tener Brand Kit, porque nadie lo revisaría con la misma desconfianza.
 */
export async function runExtraction(_prev: WizardState, form: FormData): Promise<WizardState> {
  const { member } = await requireMember();
  if (member.role !== "admin") return { phase: "error", message: "No tienes permiso." };

  const url = String(form.get("url") ?? "").trim();
  if (!/^https?:\/\/.+\..+/.test(url)) {
    return { phase: "error", message: "Escribe una URL completa, con https://" };
  }

  const missing = [...missingEnv("firecrawl"), ...missingEnv("anthropic")];
  if (!isConfigured("firecrawl") || !isConfigured("anthropic")) {
    return { phase: "blocked", missing };
  }

  try {
    const r = await extractBrandKit(url);
    const { costUsd } = await import("@/os/providers/anthropic");
    return {
      phase: "done",
      identity: r.identity,
      voice: r.voice,
      business: r.business,
      personas: r.personas,
      pagesRead: r.pagesRead,
      costUsd: costUsd(r.usage),
    };
  } catch (e) {
    return { phase: "error", message: e instanceof Error ? e.message : "Fallo desconocido" };
  }
}
