import { BASE_URL, MODEL, structured } from "../src/os/providers/anthropic";

/**
 * Comprueba que el proveedor de LLM configurado responde y devuelve JSON válido.
 *
 *   npm run probar:llm
 *
 * Sirve para lo mismo con Claude y con cualquier proveedor que hable el protocolo de
 * mensajes de Anthropic: si esto pasa, la extracción del Brand Kit y la generación de
 * copys van a funcionar.
 */
async function main() {
  const { value: r, usage } = await structured<{ tono: string[]; propuesta: string }>({
    system: [{ text: "Eres analista de marca. Escribes en español de España." }],
    user: "Empresa: taller mecánico multimarca en Paterna, con presupuesto cerrado y coche de sustitución incluido.",
    schema: {
      type: "object", additionalProperties: false, required: ["tono", "propuesta"],
      properties: {
        tono: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
        propuesta: { type: "string" },
      },
    },
    maxTokens: 3000,
  });

  console.log(`\n  modelo:    ${MODEL}`);
  console.log(`  base:      ${BASE_URL ?? "api.anthropic.com"}`);
  console.log(`  tono:      ${r.tono?.join(", ")}`);
  console.log(`  propuesta: ${r.propuesta}`);
  console.log(`  tokens:    ${usage.inputTokens} entrada · ${usage.outputTokens} salida\n`);
}

main().catch((e) => {
  console.error("\n  Fallo:", e instanceof Error ? e.message : e, "\n");
  process.exit(1);
});
