import { writeFileSync } from "node:fs";
import { auditar } from "../src/os/audit/run";
import { FUNCIONES } from "../src/os/audit/types";

/** CLI: `npm run audit -- <dominio> [--json salida.json]` */

const args = process.argv.slice(2);
const dominio = args.find((a) => !a.startsWith("--"));
if (!dominio) {
  console.error("Uso: npm run audit -- <dominio> [--json salida.json]");
  process.exit(1);
}
const jsonPath = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;

const C = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  b: (s: string) => `\x1b[1m${s}\x1b[0m`,
  rojo: (s: string) => `\x1b[31m${s}\x1b[0m`,
  ambar: (s: string) => `\x1b[33m${s}\x1b[0m`,
  verde: (s: string) => `\x1b[32m${s}\x1b[0m`,
  gris: (s: string) => `\x1b[90m${s}\x1b[0m`,
};
const COLOR = { p0: C.rojo, p1: C.rojo, p2: C.ambar, p3: C.gris };

console.log(C.dim(`\nAuditando ${dominio}…\n`));

auditar(dominio).then((a) => {
  console.log(C.b(`AUDITORÍA · ${a.dominio}`));
  console.log(C.dim(`${a.urlFinal} · ${a.señales.length} señales en ${(a.duracionMs / 1000).toFixed(1)} s\n`));

  const neg = a.hallazgos.filter((h) => !h.positivo);
  const pos = a.hallazgos.filter((h) => h.positivo);

  if (pos.length) {
    console.log(C.b("LO QUE FUNCIONA"));
    for (const h of pos) console.log(`  ${C.verde("✓")} ${h.titulo}`);
    console.log();
  }

  console.log(C.b(`HALLAZGOS (${neg.length})`));
  for (const h of neg) {
    const c = COLOR[h.gravedad];
    console.log(`\n  ${c(h.gravedad.toUpperCase())} ${C.b(h.titulo)}  ${C.dim(FUNCIONES[h.funcion].nombre)}`);
    console.log(`     ${C.dim("Situación.")}    ${h.situacion}`);
    console.log(`     ${C.dim("Consecuencia.")} ${h.consecuencia}`);
    console.log(`     ${C.dim("Solución.")}     ${h.solucion}`);
    console.log(`     ${C.dim(`evidencia: ${h.evidencia.join(", ")} · confianza ${h.confianza}`)}`);
  }

  console.log(C.b("\n\nCOBERTURA POR FUNCIÓN"));
  for (const c of a.cobertura) {
    if (c.verificadas + c.pendientes === 0) continue;
    const barra = "█".repeat(Math.round(c.pct / 10)).padEnd(10, "·");
    console.log(`  ${String(FUNCIONES[c.funcion].nombre).padEnd(28)} ${barra} ${String(c.pct).padStart(3)}%  ` +
      C.dim(`${c.verificadas} verificadas${c.pendientes ? `, ${c.pendientes} pendientes` : ""}`));
  }

  if (a.fuentesNoDisponibles.length) {
    console.log(C.b("\nFUENTES NO DISPONIBLES"));
    for (const f of a.fuentesNoDisponibles) console.log(`  ${C.ambar("○")} ${C.b(f.fuente)}: ${f.motivo}`);
  }

  if (jsonPath) {
    writeFileSync(jsonPath, JSON.stringify(a, null, 2));
    console.log(C.dim(`\nJSON completo en ${jsonPath}`));
  }
  console.log();
}).catch((e) => { console.error("Fallo:", e); process.exit(1); });
