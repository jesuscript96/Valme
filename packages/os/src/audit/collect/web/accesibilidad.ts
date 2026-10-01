import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { Añadido } from "../base/runtime";
import { señal, type Señal } from "../../types";

/**
 * ACCESIBILIDAD · paso 4 (¿puede?)
 *
 * axe-core es el estándar y es determinista: unas noventa reglas, sin falsos positivos
 * relevantes. No detecta todo — lo que depende de contexto necesita ojos humanos — pero
 * lo que detecta es indiscutible, y eso es justo lo que hace falta en una reunión.
 *
 * Se inyecta el fichero en la página que ya está cargada en vez de usar
 * `@axe-core/playwright`, que arrastra `playwright` completo cuando aquí solo tenemos
 * `playwright-core`.
 */

const require_ = createRequire(import.meta.url);

let fuenteAxe: string | null = null;
function cargarAxe(): string {
  fuenteAxe ??= readFileSync(require_.resolve("axe-core/axe.min.js"), "utf8");
  return fuenteAxe;
}

type Resultado = {
  violations: {
    id: string;
    impact: "minor" | "moderate" | "serious" | "critical" | null;
    help: string;
    helpUrl: string;
    nodes: { target: string[] }[];
  }[];
  passes: { id: string }[];
};

export const accesibilidad: Añadido = {
  nombre: "Accesibilidad",
  async ejecutar(page, url) {
    await page.addScriptTag({ content: cargarAxe() });

    const r = (await page.evaluate(`(async () => {
      // Solo las reglas de las normas que importan legalmente. Las buenas prácticas
      // sueltas generan ruido que nadie va a arreglar.
      const res = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
        resultTypes: ["violations"],
      });
      return {
        violations: res.violations.map((v) => ({
          id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl,
          nodes: v.nodes.slice(0, 5).map((n) => ({ target: n.target })),
        })),
        passes: res.passes.map((p) => ({ id: p.id })),
      };
    })()`)) as Resultado;

    const base = { funcion: 7 as const, fuente: "axe-core", url };
    const s = (id: string, que: string, valor: Señal["valor"], limite?: string) =>
      señal({ ...base, id, que, valor, estado: "verificado", limite });

    const graves = r.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    const afectados = r.violations.reduce((t, v) => t + v.nodes.length, 0);

    const out: Señal[] = [
      s("a11y.violaciones", "Reglas de accesibilidad incumplidas", r.violations.length,
        "axe detecta lo automatizable. Lo que depende de contexto necesita revisión humana, así que cero violaciones no significa accesible."),
      s("a11y.graves", "De ellas, graves o críticas", graves.length),
      s("a11y.elementos", "Elementos afectados (tope de 5 por regla)", afectados),
      s("a11y.reglas", "Reglas concretas incumplidas",
        r.violations.slice(0, 12).map((v) => `${v.id}: ${v.help}`)),
    ];

    // El contraste se saca aparte porque es el que más aparece y el más barato de arreglar.
    const contraste = r.violations.find((v) => v.id === "color-contrast");
    out.push(s("a11y.contraste", "Elementos con contraste insuficiente",
      contraste ? contraste.nodes.length : 0));

    return out;
  },
};
