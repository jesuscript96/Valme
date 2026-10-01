/**
 * Lectura de robots.txt por grupos de User-agent. Pura, para poder probarla.
 *
 * Interesa sobre todo para GEO: si los rastreadores de los asistentes (GPTBot,
 * ClaudeBot, PerplexityBot…) tienen prohibida la raíz, la empresa no puede salir en sus
 * respuestas por mucho contenido que publique.
 */

export const BOTS_IA = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "anthropic-ai",
  "PerplexityBot", "Google-Extended", "CCBot", "Applebot-Extended",
] as const;

/** Agentes de la lista que tienen `Disallow: /` en un grupo propio. */
export function botsBloqueados(robots: string, bots: readonly string[] = BOTS_IA): string[] {
  const grupos: { agentes: string[]; bloqueaRaiz: boolean }[] = [];
  let actual: { agentes: string[]; bloqueaRaiz: boolean } | null = null;
  let leyendoAgentes = false;

  for (const bruta of robots.split(/\r?\n/)) {
    const linea = bruta.replace(/#.*/, "").trim();
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(linea);
    if (!m) continue;
    const campo = m[1].toLowerCase();
    const valor = m[2].trim();
    if (campo === "user-agent") {
      if (!actual || !leyendoAgentes) {
        actual = { agentes: [], bloqueaRaiz: false };
        grupos.push(actual);
      }
      actual.agentes.push(valor.toLowerCase());
      leyendoAgentes = true;
    } else {
      leyendoAgentes = false;
      if (actual && campo === "disallow" && valor === "/") actual.bloqueaRaiz = true;
    }
  }

  return bots.filter((bot) =>
    grupos.some((g) => g.bloqueaRaiz && g.agentes.includes(bot.toLowerCase())),
  );
}
