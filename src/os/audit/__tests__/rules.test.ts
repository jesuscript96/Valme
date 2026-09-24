import { strict as assert } from "node:assert";
import { test } from "node:test";
import { aplicar, cobertura, REGLAS } from "../rules";
import { type Señal } from "../types";

const s = (id: string, valor: Señal["valor"], estado: Señal["estado"] = "verificado"): Señal => ({
  id, valor, estado, funcion: 8, que: id, fuente: "test", observadoEn: new Date().toISOString(),
});

test("una señal PARCIAL bloquea su regla: ausencia de dato no es hallazgo", () => {
  const verificada = aplicar([s("paid.pixel_meta", false, "verificado")]);
  const parcial = aplicar([s("paid.pixel_meta", false, "parcial")]);

  assert.ok(verificada.some((h) => h.id === "sin_pixel"), "con dato verificado sí se emite");
  assert.ok(!parcial.some((h) => h.id === "sin_pixel"), "con dato parcial NO se emite");
});

test("una señal que falta del todo tampoco dispara la regla", () => {
  assert.equal(aplicar([]).length, 0);
});

test("todo hallazgo cita las señales que lo sostienen", () => {
  const h = aplicar([
    s("datos.herramientas", []),
    s("seo.sitemap", false),
    s("web.formularios", 0),
  ]);
  assert.ok(h.length > 0);
  for (const x of h) {
    assert.ok(x.evidencia.length > 0, `${x.id} no cita evidencia`);
  }
});

test("los positivos se reconocen y van los primeros", () => {
  const h = aplicar([
    s("datos.dmarc_politica", "reject"),
    s("datos.herramientas", []),
  ]);
  assert.equal(h[0].positivo, true, "lo que funciona se dice antes de proponer nada");
  assert.ok(h.some((x) => x.gravedad === "p0"));
});

test("los negativos se ordenan por gravedad", () => {
  const h = aplicar([
    s("seo.llmstxt", false),        // p3
    s("datos.herramientas", []),    // p0
    s("web.formularios", 0),        // p1
  ]).filter((x) => !x.positivo);
  assert.deepEqual(h.map((x) => x.gravedad), ["p0", "p1", "p3"]);
});

test("un DMARC en quarantine es positivo y en none es hallazgo", () => {
  assert.equal(aplicar([s("datos.dmarc_politica", "quarantine")])[0].positivo, true);
  assert.equal(aplicar([s("datos.dmarc_politica", "none")])[0].positivo, false);
});

test("cada regla declara al menos una señal necesaria", () => {
  for (const r of REGLAS) {
    assert.ok(r.necesita.length > 0, `la regla ${r.id} no declara señales`);
  }
});

test("los ids de regla son únicos", () => {
  const ids = REGLAS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("la cobertura no cuenta lo que no aplica", () => {
  const c = cobertura([
    { ...s("a", 1, "verificado"), funcion: 2 },
    { ...s("b", 1, "no_aplica"), funcion: 2 },
  ]);
  const paid = c.find((x) => x.funcion === 2)!;
  assert.equal(paid.pct, 100, "una comprobación que no aplica no penaliza la cobertura");
});

test("la cobertura baja cuando hay pendientes", () => {
  const c = cobertura([
    { ...s("a", 1, "verificado"), funcion: 3 },
    { ...s("b", 1, "pendiente"), funcion: 3 },
  ]);
  assert.equal(c.find((x) => x.funcion === 3)!.pct, 50);
});

// --- Invariantes de la estructura por áreas -------------------------------
// Estas pruebas protegen el modelo de trabajo del equipo: cada especialista
// añade reglas a su fichero y estas comprueban que no rompe a los demás.

test("cada regla vive en el fichero de su función", async () => {
  const mods: [number, string][] = [
    [1, "01-estrategia"], [2, "02-paid"], [3, "03-seo"], [4, "04-social"],
    [5, "05-creatividad"], [6, "06-copy"], [7, "07-web"], [8, "08-datos"],
  ];
  for (const [funcion, fichero] of mods) {
    const m = await import(`../rules/${fichero}`);
    for (const r of m.REGLAS) {
      assert.equal(r.funcion, funcion, `la regla ${r.id} está en ${fichero} pero declara función ${r.funcion}`);
    }
  }
});

test("toda regla produce hallazgos con los cuatro campos del método", () => {
  // Se inventan señales con valores extremos para forzar que disparen.
  const extremos: Señal[] = REGLAS.flatMap((r) =>
    r.necesita.map((id) => s(id, 0, "verificado")));
  for (const h of aplicar(extremos)) {
    for (const campo of ["titulo", "situacion", "consecuencia", "solucion"] as const) {
      assert.ok(h[campo] && h[campo].length > 10, `${h.id} no tiene ${campo} útil`);
    }
  }
});

test("ningún texto usa guiones largos", () => {
  const extremos: Señal[] = REGLAS.flatMap((r) => r.necesita.map((id) => s(id, 0, "verificado")));
  for (const h of aplicar(extremos)) {
    const todo = `${h.titulo} ${h.situacion} ${h.consecuencia} ${h.solucion}`;
    assert.ok(!todo.includes("—"), `${h.id} usa un guion largo`);
  }
});
