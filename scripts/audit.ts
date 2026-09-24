import { writeFileSync } from "node:fs";
import { auditar } from "../src/os/audit/run";
import { CLAVES, HERRAMIENTAS, type Herramienta } from "../src/os/audit/tools";
import { FUNCIONES, PASOS, type Paso } from "../src/os/audit/types";
import { evaluarComprobaciones } from "../src/os/audit/web-checks";

/**
 * CLI del auditor.
 *
 *   npm run audit -- <dominio>                     las tres herramientas
 *   npm run audit -- <dominio> --tool paid         solo la tuya, mientras desarrollas
 *   npm run audit -- <dominio> --tool seo,web      varias
 *   npm run audit -- <dominio> --json salida.json  todas las señales en bruto
 */

const args = process.argv.slice(2);
const dominio = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--tool" && args[i - 1] !== "--json");
if (!dominio) {
  console.error(`Uso: npm run audit -- <dominio> [--tool ${CLAVES.join("|")}] [--json salida.json]`);
  process.exit(1);
}
const jsonPath = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;

const pedidas = args.includes("--tool")
  ? (args[args.indexOf("--tool") + 1] ?? "").split(",").map((t) => t.trim())
  : CLAVES;

const invalidas = pedidas.filter((t) => !CLAVES.includes(t as Herramienta["clave"]));
if (invalidas.length) {
  console.error(`Herramienta desconocida: ${invalidas.join(", ")}. Hay: ${CLAVES.join(", ")}`);
  process.exit(1);
}
const herramientas = pedidas as Herramienta["clave"][];

const C = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  b: (s: string) => `\x1b[1m${s}\x1b[0m`,
  rojo: (s: string) => `\x1b[31m${s}\x1b[0m`,
  ambar: (s: string) => `\x1b[33m${s}\x1b[0m`,
  verde: (s: string) => `\x1b[32m${s}\x1b[0m`,
  gris: (s: string) => `\x1b[90m${s}\x1b[0m`,
};
const COLOR = { p0: C.rojo, p1: C.rojo, p2: C.ambar, p3: C.gris };

const nombres = herramientas.map((h) => HERRAMIENTAS[h].nombre).join(" · ");
console.log(C.dim(`\nAuditando ${dominio}\n${nombres}\n`));

auditar(dominio, herramientas).then((a) => {
  console.log(C.b(`AUDITORÍA · ${a.dominio}`));
  console.log(C.dim(`${a.urlFinal} · ${a.señales.length} señales en ${(a.duracionMs / 1000).toFixed(1)} s\n`));

  const neg = a.hallazgos.filter((h) => !h.positivo);
  const pos = a.hallazgos.filter((h) => h.positivo);

  if (pos.length) {
    console.log(C.b("LO QUE FUNCIONA"));
    for (const h of pos) console.log(`  ${C.verde("✓")} ${h.titulo}`);
    console.log();
  }

  const pinta = (h: (typeof neg)[number]) => {
    const c = COLOR[h.gravedad];
    console.log(`\n  ${c(h.gravedad.toUpperCase())} ${C.b(h.titulo)}  ${C.dim(FUNCIONES[h.funcion].nombre)}`);
    console.log(`     ${C.dim("Situación.")}    ${h.situacion}`);
    console.log(`     ${C.dim("Consecuencia.")} ${h.consecuencia}`);
    console.log(`     ${C.dim("Solución.")}     ${h.solucion}`);
    console.log(`     ${C.dim(`evidencia: ${h.evidencia.join(", ")} · confianza ${h.confianza}`)}`);
  };

  // Si los hallazgos traen paso del embudo, el informe se lee como un recorrido y no
  // como una lista por categorías. Es toda la diferencia delante de un cliente.
  const conPaso = neg.filter((h) => h.paso);
  if (conPaso.length) {
    for (const clave of Object.keys(PASOS) as Paso[]) {
      const delPaso = neg.filter((h) => h.paso === clave);
      const p = PASOS[clave];
      const ok = delPaso.length === 0;
      console.log(
        `\n${C.b(`${p.n}. ${p.titulo}`)}  ${C.dim(p.desc)}  ` +
        (ok ? C.verde("sin problemas") : COLOR[delPaso[0].gravedad](`${delPaso.length}`)),
      );
      delPaso.forEach(pinta);
    }
    const sinPaso = neg.filter((h) => !h.paso);
    if (sinPaso.length) {
      console.log(C.b("\nOtros"));
      sinPaso.forEach(pinta);
    }
  } else {
    console.log(C.b(`HALLAZGOS (${neg.length})`));
    neg.forEach(pinta);
  }

  console.log(C.b("\n\nCOBERTURA POR FUNCIÓN"));
  for (const c of a.cobertura) {
    if (c.verificadas + c.pendientes === 0) continue;
    const barra = "█".repeat(Math.round(c.pct / 10)).padEnd(10, "·");
    console.log(`  ${String(FUNCIONES[c.funcion].nombre).padEnd(28)} ${barra} ${String(c.pct).padStart(3)}%  ` +
      C.dim(`${c.verificadas} verificadas${c.pendientes ? `, ${c.pendientes} pendientes` : ""}`));
  }

  // Qué se ha mirado, para las herramientas que declaran catálogo.
  if (herramientas.includes("web")) {
    const comps = evaluarComprobaciones(a.señales.map((s) => s.id));
    const r = comps.filter((c) => c.estado === "respondida").length;
    const b = comps.filter((c) => c.estado === "bloqueada").length;
    console.log(C.b(`\n\nQUÉ SE HA COMPROBADO  ${C.dim(`${r} de ${comps.length}`)}`));
    for (const clave of Object.keys(PASOS) as Paso[]) {
      const del = comps.filter((c) => c.paso === clave);
      if (!del.length) continue;
      const hechas = del.filter((c) => c.estado === "respondida").length;
      console.log(`  ${C.dim(`${PASOS[clave].n}.`)} ${PASOS[clave].titulo.padEnd(18)} ${hechas}/${del.length}`);
    }
    if (b) console.log(C.dim(`  ${b} bloqueadas por falta de credenciales`));
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
