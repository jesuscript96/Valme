// Comprueba que cada `@valme/os/...` que se importa en el monorepo resuelve a un fichero
// a través del campo `exports` de packages/os/package.json.
//
// Hace falta porque `exports` no prueba extensiones: un `.ts` nuevo dentro de una carpeta
// de `.tsx` (o una carpeta con index.ts) necesita su propia entrada, y sin esto el fallo
// sólo aparece al compilar la web o al arrancar el worker.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(pkgDir, "..", "..");
const { exports } = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));

function resolve(sub) {
  const key = `./${sub}`;
  if (exports[key]) return exports[key];
  const patterns = Object.keys(exports)
    .filter((k) => k.endsWith("*") && key.startsWith(k.slice(0, -1)))
    .sort((a, b) => b.length - a.length);
  if (!patterns.length) return null;
  return exports[patterns[0]].replace("*", key.slice(patterns[0].length - 1));
}

function* files(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(ts|tsx|mts)$/.test(name)) yield p;
  }
}

const malos = [];
for (const base of ["apps", "packages"]) {
  for (const file of files(join(root, base))) {
    const src = readFileSync(file, "utf8");
    for (const [, spec] of src.matchAll(/["']@valme\/os\/([^"']+)["']/g)) {
      const target = resolve(spec);
      if (!target || !existsSync(join(pkgDir, target))) {
        malos.push(`${relative(root, file)}: @valme/os/${spec} → ${target ?? "sin entrada en exports"}`);
      }
    }
  }
}

if (malos.length) {
  console.error(`Imports de @valme/os que no resuelven:\n  ${malos.join("\n  ")}`);
  process.exit(1);
}
console.log("exports de @valme/os: todo resuelve");
