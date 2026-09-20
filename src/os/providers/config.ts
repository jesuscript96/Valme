import "server-only";

/**
 * Qué integraciones están configuradas de verdad.
 *
 * Todo el código de los proveedores es real. Lo que no hay son credenciales, así que
 * cada superficie que depende de una comprueba esto y dice explícitamente que falta,
 * en vez de fallar con un 401 opaco o — peor — de fingir un resultado.
 */
export type ProviderKey = "firecrawl" | "anthropic" | "higgsfield" | "resend" | "meta";

export const PROVIDER_ENV: Record<ProviderKey, string[]> = {
  firecrawl: ["FIRECRAWL_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"],
  higgsfield: ["HF_API_KEY_ID", "HF_API_KEY_SECRET"],
  resend: ["RESEND_API_KEY"],
  meta: ["META_APP_ID", "META_APP_SECRET"],
};

export const PROVIDER_LABEL: Record<ProviderKey, string> = {
  firecrawl: "Firecrawl",
  anthropic: "Claude (Anthropic)",
  higgsfield: "Higgsfield",
  resend: "Resend",
  meta: "Meta Marketing API",
};

export function isConfigured(p: ProviderKey): boolean {
  return PROVIDER_ENV[p].every((k) => Boolean(process.env[k]));
}

export function missingEnv(p: ProviderKey): string[] {
  return PROVIDER_ENV[p].filter((k) => !process.env[k]);
}

export class ProviderNotConfiguredError extends Error {
  constructor(readonly provider: ProviderKey) {
    super(
      `${PROVIDER_LABEL[provider]} no está configurado. Faltan: ${missingEnv(provider).join(", ")}.`,
    );
    this.name = "ProviderNotConfiguredError";
  }
}

export function requireEnv(p: ProviderKey): void {
  if (!isConfigured(p)) throw new ProviderNotConfiguredError(p);
}
